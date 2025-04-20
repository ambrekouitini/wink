import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import * as Clipboard from 'expo-clipboard';

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

  const generateDeepLink = (eventId: string) => `planify://event/${eventId}`;

  const copyToClipboard = (eventId: string) => {
    const link = generateDeepLink(eventId);
    Clipboard.setStringAsync(link);
    Alert.alert('Lien copié', 'Le lien de l’événement a été copié.');
  };

  useEffect(() => {
    const fetchEvent = async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Erreur récupération event :", error);
      } else {
        setEvent(data);
      }
      setLoading(false);
    };

    if (id) fetchEvent();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Événement introuvable.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{event.title}</Text>

        <Text style={styles.sectionLabel}>📍 Lieu</Text>
        <Text style={styles.sectionText}>{event.location}</Text>

        {event.description && (
          <>
            <Text style={styles.sectionLabel}>📝 Description</Text>
            <Text style={styles.sectionText}>{event.description}</Text>
          </>
        )}

        <Text style={styles.sectionLabel}>🗓️ Dates proposées</Text>
        {event.proposed_dates.map((date, index) => (
          <Text key={index} style={styles.sectionText}>
            {new Date(date).toLocaleDateString()}
          </Text>
        ))}

        <Text style={styles.sectionLabel}>🕓 Créé le</Text>
        <Text style={styles.sectionText}>
          {new Date(event.created_at).toLocaleString()}
        </Text>

        <TouchableOpacity style={styles.copyButton} onPress={() => copyToClipboard(event.id)}>
          <Text style={styles.copyButtonText}>Copier le lien de l’événement</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: "#f9f9f9",
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#f9f9f9",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#888",
  },
  emptyText: {
    fontSize: 18,
    color: "#999",
  },
  card: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#eee",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 4,
    color: "#333",
  },
  sectionText: {
    fontSize: 16,
    color: "#444",
  },
  copyButton: {
    marginTop: 24,
    backgroundColor: "#000",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  copyButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
