import { FlatList, Text, View, TouchableOpacity, Image } from 'react-native'
import React, { useState, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import EmptyState from '../../components/EmptyState'
import { getUserPosts, getUserById } from '../../lib/appwrite'  
import { router, useLocalSearchParams } from 'expo-router'
import VideoCard from '../../components/VideoCard'
import { signOut } from '../../lib/appwrite'
import useAppwrite from '../../lib/useAppwrite'
import { useGlobalContext } from '../../context/GlobalProvider'
import { icons } from '../../constants'
import InfoBox from '../../components/InfoBox'

const UserProfile = () => {
  const { id } = useLocalSearchParams();
  const { user, setUser, setIsLogged } = useGlobalContext();
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const { data: posts } = useAppwrite(() => getUserPosts(id));

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const userData = await getUserById(id);
        setProfileUser(userData);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [id]);

  const logout = async () => {
    await signOut();
    setIsLogged(false);
    setUser(null);
    router.replace('/sign-in');
  }

  if (loading) {
    return (
      <SafeAreaView className="bg-primary h-full">
        <View className="flex-1 justify-center items-center">
          <Text className="text-white">Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profileUser) {
    return (
      <SafeAreaView className="bg-primary h-full">
        <View className="flex-1 justify-center items-center">
          <Text className="text-white">User not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="bg-primary h-full">
      <FlatList
        data={posts}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => (
          <VideoCard video={item} />
        )}
        ListHeaderComponent={() => (
          <View className='w-full justify-center items-center mt-6 mb-12 px-4'>
            <TouchableOpacity className="w-full items-end mb-10" onPress={() => router.back()}>
              <Image source={icons.back} resizeMode='contain' className='w-6 h-6'/>
            </TouchableOpacity>
            <View className='w-16 h-16 rounded-lg border border-secondary justify-center items-center'>
              <Image 
                source={{uri: profileUser?.avatar}} 
                className='w-[98%] h-[98%] rounded-lg' 
                resizeMode='cover'/>
            </View>
            <InfoBox
              title={profileUser?.username}
              containerStyles="mt-5"
              titleStyles="text-lg"
            />

            <View className="mt-5 flex-row justify-between items-center">
              <InfoBox
                title={posts?.length || 0}
                subtitle="Posts"
                containerStyles="mr-10"
                titleStyles="text-xl"
              />
              <InfoBox
                title="1.2k"
                subtitle="Followers"
                titleStyles="text-xl"
              />
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <EmptyState
            title="No videos found"
            subtitle="No videos found for this user"  
          />
        )}
      />
    </SafeAreaView>
  )
}

export default UserProfile; 