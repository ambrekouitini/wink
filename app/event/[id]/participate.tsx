// NOTES 
//Après redirection, les votes de participations ne se mettent pas à jour directement, il faut revenir sur la home et revenir sur la page d'un evenement. 

import React, { useEffect, useState, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { ThemeContext } from '../../../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Event = {
  id: string;
  title: string;
  description: string;
  location: string;
  proposed_dates: string[];
  owner_id: string;
  created_at: string;
};

export default function ParticipateScreen() {
  const { id } = useLocalSearchParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  const { isDark } = useContext(ThemeContext) || { isDark: false };
  
  const theme = {
    background: isDark ? '#121212' : '#f5f5f5',
    card: isDark ? '#1E1E1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#000000',
    border: isDark ? '#333333' : '#DDDDDD',
    selected: isDark ? '#2c5282' : '#e8f5fe',
    unselected: isDark ? '#333333' : '#f5f5f5',
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData && sessionData.session) {
        setUserId(sessionData.session.user.id);
        
        if (sessionData.session.user.user_metadata?.name) {
          setUserName(sessionData.session.user.user_metadata.name);
        } else {
          const { data: userData } = await supabase
            .from('users')
            .select('name')
            .eq('id', sessionData.session.user.id)
            .single();
            
          if (userData) {
            setUserName(userData.name);
          }
        }
      }

      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (eventError) {
        try {
          const offlineData = await AsyncStorage.getItem(`event_${id}`);
          if (offlineData) {
            setEvent(JSON.parse(offlineData));
            setIsOnline(false);
          }
        } catch (offlineError) {
        }
      } else {
        setEvent(eventData);
        
        try {
          await AsyncStorage.setItem(`event_${id}`, JSON.stringify(eventData));
        } catch (storageError) {
        }
      }

      setLoading(false);
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      return date.toLocaleString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  const toggleDateSelection = (date: string) => {
    if (selectedDates.includes(date)) {
      setSelectedDates(selectedDates.filter(d => d !== date));
    } else {
      setSelectedDates([...selectedDates, date]);
    }
  };

  const handleSubmit = async () => {
    if (!userName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre nom');
      return;
    }

    if (selectedDates.length === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner au moins une date');
      return;
    }

    if (!userId) {
      Alert.alert('Erreur', 'Vous devez être connecté pour participer');
      return;
    }

    setSubmitting(true);

    try {
      if (!isOnline) {
        const offlineVote = {
          user_id: userId,
          event_id: id,
          selected_dates: selectedDates,
          name: userName,
          pending: true
        };
        
        let pendingVotes = [];
        try {
          const storedVotes = await AsyncStorage.getItem('pending_votes');
          pendingVotes = storedVotes ? JSON.parse(storedVotes) : [];
        } catch (error) {
        }
        
        pendingVotes.push(offlineVote);
        await AsyncStorage.setItem('pending_votes', JSON.stringify(pendingVotes));
        
        Alert.alert(
          'Vote enregistré localement', 
          'Votre vote sera synchronisé une fois la connexion rétablie',
          [{ text: 'OK', onPress: () => router.back() }]
        );
        return;
      }

      const { error } = await supabase
        .from('votes')
        .insert([
          {
            user_id: userId,
            event_id: id,
            selected_dates: selectedDates
          }
        ]);

      if (error) throw error;

      setTimeout(() => {
        Alert.alert('Succès', 'Votre participation a été enregistrée!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }, 500);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={isDark ? "#FFFFFF" : "#000000"} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>Événement non trouvé</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: theme.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Participer</Text>
        <View style={styles.placeholderRight} />
      </View>
      
      <View style={styles.content}>
        <Text style={[styles.eventTitle, { color: theme.text }]}>{event.title}</Text>
        
        {!isOnline && (
          <View style={[styles.offlineNotice, { backgroundColor: isDark ? '#4a3823' : '#fff3e0' }]}>
            <Text style={[styles.offlineText, { color: isDark ? '#ffcc80' : '#e65100' }]}>
              Mode hors ligne - Vos votes seront synchronisés lorsque la connexion sera rétablie
            </Text>
          </View>
        )}
        
        <View style={[styles.formSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Votre nom</Text>
          <TextInput
            style={[
              styles.input, 
              { 
                color: theme.text, 
                borderColor: theme.border,
                backgroundColor: isDark ? '#2d2d2d' : '#f9f9f9'
              }
            ]}
            value={userName}
            onChangeText={setUserName}
            placeholder="Entrez votre nom"
            placeholderTextColor={isDark ? '#aaaaaa' : '#999999'}
          />
        </View>
        
        <View style={[styles.formSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Dates disponibles</Text>
          <Text style={[styles.sectionSubtitle, { color: isDark ? '#aaaaaa' : '#666666' }]}>
            Sélectionnez les dates auxquelles vous êtes disponible
          </Text>
          
          <View style={styles.datesContainer}>
            {event.proposed_dates.map((date, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dateItem,
                  { 
                    backgroundColor: selectedDates.includes(date) ? theme.selected : theme.unselected,
                    borderColor: selectedDates.includes(date) ? (isDark ? '#ffffff' : '#000000') : theme.border
                  }
                ]}
                onPress={() => toggleDateSelection(date)}
              >
                <Text 
                  style={[
                    styles.dateText, 
                    { 
                      color: theme.text,
                      fontWeight: selectedDates.includes(date) ? 'bold' : 'normal' 
                    }
                  ]}
                >
                  {formatDate(date)}
                </Text>
                
                {selectedDates.includes(date) && (
                  <View style={[styles.checkmark, { backgroundColor: isDark ? '#ffffff' : '#000000' }]}>
                    <Text style={[styles.checkmarkText, { color: isDark ? '#000000' : '#ffffff' }]}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <TouchableOpacity 
          style={[
            styles.submitButton, 
            { backgroundColor: isDark ? '#ffffff' : '#000000' },
            submitting && { opacity: 0.7 }
          ]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={isDark ? "#000000" : "#ffffff"} />
          ) : (
            <Text style={[styles.submitButtonText, { color: isDark ? '#000000' : '#ffffff' }]}>
              Enregistrer ma participation
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholderRight: {
    width: 44,
    height: 44,
  },
  content: {
    padding: 20,
  },
  eventTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  offlineNotice: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  offlineText: {
    fontSize: 14,
    textAlign: 'center',
  },
  formSection: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  datesContainer: {
    gap: 12,
  },
  dateItem: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    flex: 1,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    fontWeight: 'bold',
  },
  submitButton: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 40,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});