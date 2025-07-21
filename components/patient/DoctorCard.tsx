import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';

export default function DoctorCard({ doctor, onPress }) {
  const getInitials = (name) =>
    name ? name.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase() : '';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {doctor.profiles?.avatar_url ? (
        <Image source={{ uri: doctor.profiles.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={styles.initialsAvatar}>
          <Text style={styles.initialsText}>{getInitials(doctor.profiles?.full_name)}</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name}>{doctor.profiles?.full_name}</Text>
        <Text style={styles.specialty}>{doctor.specialty}</Text>
        <Text style={styles.hospital}>{doctor.hospital_name}</Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );
}
const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', padding: 16, margin: 8, backgroundColor: '#fff', borderRadius: 10, elevation: 2 },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 14 },
  initialsAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: 14, backgroundColor: '#2196f3', alignItems: 'center', justifyContent: 'center' },
  initialsText: { color: '#fff', fontWeight: 'bold', fontSize: 20 },
  info: { flex: 1 },
  name: { fontWeight: 'bold', fontSize: 16, marginBottom: 3 },
  specialty: { fontSize: 14, color: '#2196f3', marginBottom: 2 },
  hospital: { fontSize: 12, color: '#757575' },
  arrow: { fontSize: 24, color: '#aaa', marginLeft: 8 },
});
