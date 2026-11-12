import React, { useState } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { FoFConnectionResult, getTeamFoFConnections } from '@/services/fof-network';
import { FoFTeamConnectionsModal } from './FoFTeamConnectionsModal';

interface FoFAvatarStackProps {
  teamName?: string;
  captainName?: string;
  connections?: FoFConnectionResult[];
  size?: number;
  maxAvatars?: number;
  showCountBadge?: boolean;
  interactive?: boolean;
}

export function FoFAvatarStack({
  teamName = 'Opponent Team',
  captainName,
  connections: customConnections,
  size = 28,
  maxAvatars = 2,
  showCountBadge = true,
  interactive = true,
}: FoFAvatarStackProps) {
  const theme = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  // Resolve multiple FoF connections for this team/squad
  const connections: FoFConnectionResult[] =
    customConnections && customConnections.length > 0
      ? customConnections
      : getTeamFoFConnections(teamName, captainName);

  // Display primary player plus 1 mutual friend (or maxAvatars)
  const displayAvatars = connections.slice(0, maxAvatars);

  const handlePress = (e: any) => {
    if (!interactive) return;
    e?.stopPropagation?.();
    setModalVisible(true);
  };

  const getSafeUri = (avatarUrl?: string) => {
    if (typeof avatarUrl === 'string' && (avatarUrl.startsWith('http') || avatarUrl.startsWith('data:'))) {
      return { uri: avatarUrl };
    }
    return { uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=85' };
  };

  const overlapMargin = -Math.max(6, Math.round(size * 0.28));

  return (
    <>
      <Pressable
        disabled={!interactive}
        onPress={handlePress}
        style={({ pressed }) => [
          styles.container,
          pressed && interactive && { opacity: 0.8 },
        ]}
      >
        <View style={styles.stackRow}>
          {displayAvatars.map((conn, idx) => {
            const avatarUri = getSafeUri(conn.targetAvatar);
            return (
              <View
                key={`${conn.targetPhone}-${idx}`}
                style={[
                  styles.avatarWrap,
                  {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    marginLeft: idx === 0 ? 0 : overlapMargin,
                    zIndex: 10 - idx,
                    borderColor: '#ffffff',
                    backgroundColor: theme.surfaceLow,
                  },
                ]}
              >
                <Image
                  source={avatarUri}
                  style={{ width: '100%', height: '100%', borderRadius: size / 2 }}
                  contentFit="cover"
                  transition={150}
                />
              </View>
            );
          })}
        </View>
      </Pressable>

      {/* Popup modal showing full multi-player FoF details */}
      {interactive && (
        <FoFTeamConnectionsModal
          visible={modalVisible}
          teamName={teamName}
          connections={connections}
          onClose={() => setModalVisible(false)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  stackRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    borderWidth: 1.5,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
});
