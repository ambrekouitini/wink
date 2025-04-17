import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';

interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  proposed_dates: string[];
  created_at: string;
}

export default function EventDetails() {
  const { id } = useLocalSearchParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Erreur lors de la récupération de l'événement :", error);
      } else {
        setEvent(data);
      }
      setLoading(false);
    };

    if (id) fetchEvent();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
        <Text>Chargement de l'événement...</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.center}>
        <Text>Aucun événement trouvé.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{event.title}</Text>
      <Text style={styles.label}>Description :</Text>
      <Text style={styles.text}>{event.description || 'Aucune description.'}</Text>

      <Text style={styles.label}>Lieu :</Text>
      <Text style={styles.text}>{event.location}</Text>

      <Text style={styles.label}>Dates proposées :</Text>
      {event.proposed_dates.map((date, index) => (
        <Text key={index} style={styles.date}>{new Date(date).toLocaleDateString()}</Text>
      ))}

      <Text style={styles.label}>Créé le :</Text>
      <Text style={styles.text}>
        {new Date(event.created_at).toLocaleString()}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  text: {
    fontSize: 16,
    marginBottom: 10,
  },
  date: {
    fontSize: 16,
    marginLeft: 10,
    marginBottom: 4,
  },
});
