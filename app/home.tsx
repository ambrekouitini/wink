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

  useEffect(() => {
	const checkUser = async () => {
	  const { data } = await supabase.auth.getSession();

	  if (!data.session) {
		router.replace("/");
		return;
	  }
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
	  .from("events")
	  .select("*")
	  .eq("owner_id", userId)
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
		Connecté en tant que: {user ? user.email : "Utilisateur inconnu"}
	  </Text>

	  <View style={styles.buttonContainer}>
		<TouchableOpacity style={styles.button} onPress={navigateToCreateEvent}>
		  <Text style={styles.buttonText}>Créer un événement</Text>
		</TouchableOpacity>

		<TouchableOpacity style={styles.button}>
		  <Text style={styles.buttonText}>Mes événements</Text>
		</TouchableOpacity>

		<TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
		  <Text style={styles.buttonText}>Se déconnecter</Text>
		</TouchableOpacity>
	  </View>

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
	backgroundColor: "#f5f5f5",
	padding: 20,
  },
  title: {
	fontSize: 22,
	fontWeight: "bold",
	marginTop: 40,
	marginBottom: 10,
  },
  subtitle: {
	fontSize: 16,
	marginBottom: 30,
  },
  buttonContainer: {
	gap: 10,
  },
  button: {
	backgroundColor: "#fff",
	padding: 15,
	borderRadius: 5,
	marginBottom: 10,
	borderWidth: 1,
	borderColor: "#ddd",
  },
  logoutButton: {
	backgroundColor: "#fff",
	padding: 15,
	borderRadius: 5,
	marginTop: 20,
	borderWidth: 1,
	borderColor: "#ddd",
  },
  floatingButton: {
	position: "absolute",
	bottom: 30,
	right: 30,
	width: 60,
	height: 60,
	borderRadius: 30,
	backgroundColor: "#000",
	alignItems: "center",
  },
  logout: {
	backgroundColor: "#dc3545",
  },
  buttonText: {
	color: "#fff",
	fontWeight: "bold",
  },
  floatingButtonText: {
	color: "#fff",
	fontSize: 24,
  },
});
