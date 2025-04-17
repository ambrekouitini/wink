import React, { useState, useEffect, useContext } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  ActivityIndicator,
  useColorScheme,
  Platform
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import * as Location from 'expo-location';
import { ThemeContext } from '../../context/ThemeContext';

export default function CreateEvent() {
  const { isDark, toggleTheme } = useContext(ThemeContext) || { isDark: false, toggleTheme: () => {} };
  const systemColorScheme = useColorScheme();
  const colorScheme = isDark !== null ? isDark : systemColorScheme === 'dark';
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [proposedDates, setProposedDates] = useState(['', '']);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const theme = {
    background: colorScheme ? '#121212' : '#f5f5f5',
    card: colorScheme ? '#1E1E1E' : '#FFFFFF',
    text: colorScheme ? '#FFFFFF' : '#000000',
    border: colorScheme ? '#333333' : '#DDDDDD',
    accent: '#3498db',
    success: '#4cd964',
    error: '#ff3b30',
  };

  useEffect(() => {
    const getUserId = async () => {
      const { data } = await supabase.auth.getSession();
      if (data && data.session) {
        setUserId(data.session.user.id);
      } else {
        router.replace('/');
      }
    };
    
    getUserId();
  }, []);

  const getLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Nous ne pouvons pas accéder à votre localisation');
      return;
    }

    setLoading(true);
    try {
      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
      
      if (address) {
        const locationString = [
          address.name,
          address.street,
          address.city,
          address.region,
          address.country
        ].filter(Boolean).join(', ');
        
        setLocation(locationString);
      } else {
        setLocation(`${latitude}, ${longitude}`);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de récupérer votre position');
    } finally {
      setLoading(false);
    }
  };

  const addDateOption = () => {
    if (proposedDates.length < 5) {
      setProposedDates([...proposedDates, '']);
    } else {
      Alert.alert('Maximum atteint', 'Vous ne pouvez pas proposer plus de 5 dates');
    }
  };

  const removeDateOption = (index: number) => {
    if (proposedDates.length <= 2) {
      Alert.alert('Minimum requis', 'Vous devez proposer au moins 2 dates');
      return;
    }
    const newDates = [...proposedDates];
    newDates.splice(index, 1);
    setProposedDates(newDates);
  };

  const updateDateText = (text: string, index: number) => {
    const newDates = [...proposedDates];
    newDates[index] = text;
    setProposedDates(newDates);
  };

  const createEvent = async () => {
    if (!title.trim()) {
      Alert.alert('Erreur', 'Le titre est obligatoire');
      return;
    }

    const validDates = proposedDates.filter(date => date.trim() !== '');
    if (validDates.length < 2) {
      Alert.alert('Erreur', 'Vous devez proposer au moins 2 dates valides');
      return;
    }

    if (!userId) {
      Alert.alert('Erreur', 'Vous devez être connecté pour créer un événement');
      return;
    }

    setLoading(true);

    try {
      const { data: authData } = await supabase.auth.getSession();
     
      if (!authData.session) {
        Alert.alert("Erreur", "Session non trouvée. Veuillez vous reconnecter.");
        router.replace('/');
        return;
      }
      
      console.log("ID utilisateur:", authData.session.user.id);
      
      const eventData = {
        title,
        description,
        location,
        proposed_dates: validDates,
        owner_id: authData.session.user.id,
        created_at: new Date().toISOString()
      };
      
      console.log("Tentative d'insertion:", eventData);
      
      const { data, error } = await supabase
        .from('events')
        .insert([eventData])
        .select();

      if (error) {
        console.error("Erreur Supabase complète:", error);
        throw error;
      }

      console.log("Événement créé avec succès, données:", data);
      
      Alert.alert('Succès', 'Événement créé avec succès!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Error creating event:', error);
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: theme.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Nouvel événement</Text>
        <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
          <Text>{colorScheme ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.form}>
        <View style={[styles.inputCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.label, { color: theme.text }]}>Titre</Text>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
            value={title}
            onChangeText={setTitle}
            placeholder="Titre de l'événement"
            placeholderTextColor={colorScheme ? '#888888' : '#AAAAAA'}
          />
        </View>

        <View style={[styles.inputCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.label, { color: theme.text }]}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea, { color: theme.text, borderColor: theme.border }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Description de l'événement"
            placeholderTextColor={colorScheme ? '#888888' : '#AAAAAA'}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={[styles.inputCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.label, { color: theme.text }]}>Lieu</Text>
          <View style={styles.locationContainer}>
            <TextInput
              style={[styles.input, styles.locationInput, { color: theme.text, borderColor: theme.border }]}
              value={location}
              onChangeText={setLocation}
              placeholder="Lieu de l'événement"
              placeholderTextColor={colorScheme ? '#888888' : '#AAAAAA'}
            />
            <TouchableOpacity 
              style={[styles.locationButton, { backgroundColor: theme.accent }]}
              onPress={getLocation}
              disabled={loading}
            >
              <Text style={styles.locationButtonText}>📍</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.inputCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.label, { color: theme.text }]}>Dates proposées</Text>
          <Text style={[styles.helperText, { color: colorScheme ? '#AAAAAA' : '#777777' }]}>Format: YYYY-MM-DD HH:MM</Text>
          
          {proposedDates.map((date, index) => (
            <View key={index} style={styles.dateContainer}>
              <View style={styles.dateNumberCircle}>
                <Text style={styles.dateNumberText}>{index + 1}</Text>
              </View>
              <TextInput
                style={[styles.input, styles.dateInput, { color: theme.text, borderColor: theme.border }]}
                value={date}
                onChangeText={(text) => updateDateText(text, index)}
                placeholder="2025-04-20 18:00"
                placeholderTextColor={colorScheme ? '#888888' : '#AAAAAA'}
              />
              <TouchableOpacity 
                style={[styles.removeButton, { borderColor: theme.border }]}
                onPress={() => removeDateOption(index)}
              >
                <Text style={styles.removeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity 
            style={[styles.addDateButton, { backgroundColor: 'transparent', borderColor: theme.accent }]}
            onPress={addDateOption}
          >
            <Text style={[styles.addDateButtonText, { color: theme.accent }]}>+ Ajouter une date</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.createButton, { backgroundColor: theme.accent }]}
          onPress={createEvent}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createButtonText}>Créer l'événement</Text>
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
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
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
  themeToggle: {
    padding: 10,
  },
  form: {
    padding: 20,
    gap: 20,
  },
  inputCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  helperText: {
    fontSize: 12,
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  locationInput: {
    flex: 1,
  },
  locationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationButtonText: {
    fontSize: 18,
    color: 'white',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
  },
  dateNumberCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3498db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateNumberText: {
    color: 'white',
    fontWeight: 'bold',
  },
  dateInput: {
    flex: 1,
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    fontSize: 16,
    color: '#ff3b30',
  },
  addDateButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginTop: 5,
  },
  addDateButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  createButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  createButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});