import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  FlatList,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "../lib/supabase";
import { User } from "@supabase/supabase-js";

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
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Erreur récupération session:", sessionError.message);
        return;
      }

      if (!data.session) {
        router.replace("/");
        return;
      }

      const currentUser = data.session.user;
      setUser(currentUser);

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("name")
        .eq("id", currentUser.id);

      if (userError) {
        console.error("Erreur récupération du nom :", userError.message);
      } else if (userData.length === 0) {
        console.warn("Aucun utilisateur trouvé dans la table users avec cet ID.");
      } else {
        setUserName(userData[0].name);
      }
    };

    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserEvents(user.id);
    }
  }, [user]);

  const fetchUserEvents = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erreur lors du fetch des events:", error);
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace("/");
    } catch (error: any) {
      Alert.alert("Erreur", error.message || "Une erreur est survenue");
    }
  };

  const navigateToCreateEvent = () => {
    router.push("/event/create");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenue sur WinK</Text>
      <Text style={styles.subtitle}>
        Connecté en tant que : {userName || user?.email || "Invité"}
      </Text>

      <TouchableOpacity style={styles.button} onPress={navigateToCreateEvent}>
        <Text style={styles.buttonText}>Créer un événement</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Événements récents</Text>

      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => router.push(`/event/${item.id}`)}>
            <View style={styles.eventCard}>
              <Text style={styles.eventTitle}>{item.title}</Text>
              <Text style={styles.eventInfo}>{item.description}</Text>
              <Text style={styles.eventInfo}>{item.location}</Text>
              {item.proposed_dates.length > 0 && (
                <Text style={styles.eventDate}> 
                  {new Date(item.proposed_dates[0]).toLocaleDateString()}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={() =>
          !loading ? (
            <Text style={styles.emptyText}>Aucun événement trouvé.</Text>
          ) : null
        }
      />

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.floatingButton}
        onPress={navigateToCreateEvent}
      >
        <Text style={styles.floatingButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#111",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 30,
  },
  button: {
    backgroundColor: "#111",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111",
    marginBottom: 15,
  },
  eventCard: {
    backgroundColor: "#fafafa",
    padding: 16,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
    marginBottom: 4,
  },
  eventInfo: {
    fontSize: 14,
    color: "#444",
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 13,
    color: "#777",
  },
  emptyText: {
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 20,
  },
  logoutButton: {
    backgroundColor: "#eaeaea",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 30,
  },
  logoutText: {
    color: "#111",
    fontWeight: "600",
  },
  floatingButton: {
    position: "absolute",
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  floatingButtonText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
  },
});
