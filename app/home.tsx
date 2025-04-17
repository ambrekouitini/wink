import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, FlatList } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  proposed_dates: string[];
  created_at: string;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      
      if (!data.session) {
        router.replace('/');
        return;
      }

      setUser(data.session.user);
    };

    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
    }
  }, [user]);

  const fetchUserEvents = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors du fetch des events:', error);
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      router.replace('/');
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    }
  };

  if (!user ) {
    return (
      <View style={styles.container}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenue sur Planify</Text>
      <Text style={styles.subtitle}>Connecté en tant que: {user.email}</Text>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Créer un événement</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Mes événements</Text>
      {events.length === 0 ? (
        <Text>Aucun événement pour l’instant</Text>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.eventCard}>
              <Text style={styles.eventTitle}>{item.title}</Text>
              <Text>{item.description}</Text>
              <Text style={styles.dates}>📅 {item.proposed_dates.join(', ')}</Text>
            </View>
          )}
        />
      )}

      <TouchableOpacity onPress={handleLogout} style={[styles.button, styles.logout]}>
        <Text style={styles.buttonText}>Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  subtitle: {
    marginBottom: 20,
  },
  sectionTitle: {
    marginTop: 30,
    marginBottom: 10,
    fontSize: 18,
    fontWeight: 'bold',
  },
  eventCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  eventTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  dates: {
    marginTop: 4,
    fontStyle: 'italic',
  },
  button: {
    marginTop: 20,
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  logout: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
