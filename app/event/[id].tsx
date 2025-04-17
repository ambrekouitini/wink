import React, { useEffect, useState, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Dimensions
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { ThemeContext } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');
const BAR_WIDTH = (width - 80) / 5;

type Event = {
  id: string;
  title: string;
  description: string;
  location: string;
  proposed_dates: string[];
  owner_id: string;
  created_at: string;
};

type Vote = {
  user_id: string;
  event_id: string;
  selected_dates: string[];
};

export default function EventDetails() {
  const { id } = useLocalSearchParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedBar, setSelectedBar] = useState<string | null>(null);
  
  const { isDark } = useContext(ThemeContext) || { isDark: false };
  
  const theme = {
    background: isDark ? '#121212' : '#f5f5f5',
    card: isDark ? '#1E1E1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#000000',
    border: isDark ? '#333333' : '#DDDDDD',
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData && sessionData.session) {
        setUserId(sessionData.session.user.id);
        
        const { data: voteData } = await supabase
          .from('votes')
          .select('*')
          .eq('user_id', sessionData.session.user.id)
          .eq('event_id', id);
          
        setHasVoted(!!(voteData && voteData.length > 0));
      }

      const { data: eventData } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (eventData) {
        setEvent(eventData);
      }

      const { data: votesData } = await supabase
        .from('votes')
        .select('*')
        .eq('event_id', id);

      if (votesData) {
        setVotes(votesData);
      }

      setLoading(false);
    };

    if (id) {
      fetchData();
      
      const votesSubscription = supabase
        .channel('public:votes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'votes', filter: `event_id=eq.${id}` }, 
          () => {
            const fetchVotes = async () => {
              const { data } = await supabase
                .from('votes')
                .select('*')
                .eq('event_id', id);
                
              if (data) {
                setVotes(data);
                
                if (userId) {
                  const userVoted = data.some(vote => vote.user_id === userId);
                  setHasVoted(userVoted);
                }
              }
            };
            
            fetchVotes();
        })
        .subscribe();
        
      return () => {
        supabase.removeChannel(votesSubscription);
      };
    }
  }, [id, userId]);

  const handleBarPress = (date: string) => {
    setSelectedBar(date === selectedBar ? null : date);
  };

  const handleParticipate = () => {
    router.push(`/event/${id}/participate`);
  };

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
  
  const formatShortDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      
      return `${day}/${month}\n${hours}:${minutes}`;
    } catch (error) {
      return dateString;
    }
  };

  const getVotesCountForDate = (date: string) => {
    return votes.filter(vote => vote.selected_dates.includes(date)).length;
  };

  const getMostVotedDate = () => {
    if (!event || event.proposed_dates.length === 0) return null;
    
    return event.proposed_dates.reduce((mostVoted, date) => {
      const currentVotes = getVotesCountForDate(date);
      const mostVotedCount = mostVoted ? getVotesCountForDate(mostVoted) : -1;
      
      return currentVotes > mostVotedCount ? date : mostVoted;
    }, null as string | null);
  };

  const getMaxVotes = () => {
    if (!event) return 1;
    const maxCount = Math.max(
      ...event.proposed_dates.map(date => getVotesCountForDate(date)),
      1
    );
    return maxCount;
  };
  
  const mostVotedDate = getMostVotedDate();
  const maxVotes = getMaxVotes();

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
        <Text style={[styles.title, { color: theme.text }]}>{event.title}</Text>
        
        {event.description && (
          <Text style={[styles.description, { color: theme.text }]}>
            {event.description}
          </Text>
        )}
        
        {event.location && (
          <View style={styles.locationContainer}>
            <Text style={[styles.locationLabel, { color: theme.text }]}>Lieu: </Text>
            <Text style={[styles.locationText, { color: theme.text }]}>{event.location}</Text>
          </View>
        )}
      </View>

      <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Votes</Text>
        
        {votes.length > 0 ? (
          <>
            {mostVotedDate && (
              <View style={[styles.bestDateCard, { 
                backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
                borderWidth: 1,
                borderColor: isDark ? '#444' : '#ddd'
              }]}>
                <Text style={[styles.bestDateLabel, { color: theme.text }]}>DATE FAVORITE</Text>
                <Text style={[styles.bestDateText, { color: theme.text }]}>
                  {formatDate(mostVotedDate)}
                </Text>
                <Text style={[styles.votesCount, { color: isDark ? '#aaa' : '#666' }]}>
                  {getVotesCountForDate(mostVotedDate)} vote{getVotesCountForDate(mostVotedDate) !== 1 ? 's' : ''}
                </Text>
              </View>
            )}
            
            <View style={styles.chartContainer}>
              {event.proposed_dates.map((date, index) => {
                const votesForDate = getVotesCountForDate(date);
                const barHeight = votesForDate > 0 ? (votesForDate / maxVotes) * 160 : 0;
                const isSelected = selectedBar === date;
                
                return (
                  <View key={index} style={styles.barContainer}>
                    <TouchableOpacity 
                      activeOpacity={0.8}
                      onPress={() => handleBarPress(date)}
                      style={styles.barTouchable}
                    >
                      {votesForDate > 0 && (
                        <View style={styles.barLabelContainer}>
                          <View 
                            style={[
                              styles.bar, 
                              { 
                                height: Math.max(barHeight, 30),
                                backgroundColor: isDark ? '#ffffff' : '#000000',
                                opacity: date === mostVotedDate ? 1 : 0.6
                              }
                            ]}
                          />
                        </View>
                      )}
                      
                      <Text style={[styles.dateLabel, { color: theme.text }]}>
                        {formatShortDate(date)}
                      </Text>
                      
                      {isSelected && (
                        <View style={[styles.dateInfoCard, { 
                          backgroundColor: isDark ? '#333' : '#f8f8f8',
                          borderColor: isDark ? '#444' : '#ddd'
                        }]}>
                          <Text style={[styles.dateInfoTitle, { color: theme.text }]}>
                            {formatDate(date)}
                          </Text>
                          <Text style={[styles.dateInfoVotes, { color: isDark ? '#ddd' : '#555' }]}>
                            {votesForDate} vote{votesForDate !== 1 ? 's' : ''}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </>
        ) : (
          <View style={styles.noVotesContainer}>
            <Text style={[styles.noVotesText, { color: theme.text }]}>
              Aucun vote 😢
            </Text>
            <Text style={[styles.noVotesSubtext, { color: isDark ? '#aaa' : '#666' }]}>
              Soyez le premier à participer !
            </Text>
          </View>
        )}
      </View>
      <View style={styles.actionContainer}>
        {hasVoted ? (
          <View style={[styles.alreadyVotedContainer, { 
            backgroundColor: isDark ? '#2a2a2a' : '#f0f0f0',
            borderWidth: 1,
            borderColor: isDark ? '#444' : '#ddd'
          }]}>
            <Text style={[styles.alreadyVotedText, { color: theme.text }]}>
              Vous avez déjà participé à cet événement
            </Text>
          </View>
        ) : (
          <TouchableOpacity 
            style={[styles.participateButton, { 
              backgroundColor: isDark ? '#ffffff' : '#000000'
            }]}
            onPress={handleParticipate}
          >
            <Text style={[styles.participateButtonText, {
              color: isDark ? '#000000' : '#ffffff'
            }]}>Je participe</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 24,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  locationLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  locationText: {
    fontSize: 16,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 32,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  bestDateCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 32,
  },
  bestDateLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bestDateText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  votesCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  chartContainer: {
    flexDirection: 'row',
    marginTop: 32,
    height: 240,
    paddingBottom: 30,
    justifyContent: 'space-around',
    alignItems: 'flex-end',
  },
  barContainer: {
    alignItems: 'center',
    width: BAR_WIDTH,
    height: 200,
  },
  barTouchable: {
    flex: 1,
    width: BAR_WIDTH,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barLabelContainer: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  bar: {
    width: 20,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  dateInfoCard: {
    position: 'absolute',
    bottom: -80,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    width: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 10,
  },
  dateInfoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dateInfoVotes: {
    fontSize: 12,
  },
  actionContainer: {
    padding: 24,
    marginBottom: 32,
  },
  participateButton: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  participateButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  alreadyVotedContainer: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  alreadyVotedText: {
    fontSize: 16,
    fontWeight: '500',
  },
  noVotesContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noVotesText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  noVotesSubtext: {
    fontSize: 16,
    textAlign: 'center',
  }
});