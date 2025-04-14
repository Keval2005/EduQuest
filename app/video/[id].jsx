import { View, Text, Image, TouchableOpacity, SafeAreaView, FlatList, TextInput, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { ResizeMode, Video } from "expo-av";
import { useLocalSearchParams, useRouter } from 'expo-router';
import { icons } from '../../constants';
import { getPostById } from '../../lib/appwrite';
import { useGlobalContext } from '../../context/GlobalProvider';
import { getCommentsByPostId, createComment, editComment, deleteComment } from '../../lib/appwrite';
import FormField from '../../components/FormField';

const VideoPlayer = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aspectRatio, setAspectRatio] = useState(16/9); 

  const { user } = useGlobalContext();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');

  const handleUserProfilePress = () => {
    if (post?.creator?.$id) {
      router.push(`/profile/${post.creator.$id}`);
    }
  };

  const handleCommenterProfilePress = (userId) => {
    if (userId === user?.$id) {
      // If it's the current user's comment, redirect to tabs profile
      router.push('/(tabs)/profile');
    } else if (userId) {
      // If it's another user's comment, redirect to their profile page
      router.push(`/profile/${userId}`);
    }
  };

  // Add this useEffect for loading comments
  useEffect(() => {
    const loadComments = async () => {
      try {
        const postComments = await getCommentsByPostId(id);
        setComments(postComments);
      } catch (error) {
        console.error('Error loading comments:', error);
      }
    };
    
    if (post) loadComments();
  }, [id, post]);

  // Add comment submission handler
  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      const comment = await createComment(
        id,
        user?.$id,
        newComment.trim()
      );
      
      // Add user information to the comment before adding it to state
      const commentWithUser = {
        ...comment,
        user: {
          username: user?.username,
          avatar: user?.avatar,
          $id: user?.$id
        }
      };
      
      setComments([commentWithUser, ...comments]);
      setNewComment('');
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  // Handle edit comment
  const handleEditComment = async (commentId) => {
    if (!editText.trim()) return;
    
    try {
      // Try to update the comment on the server
      await editComment(commentId, editText.trim());
    } catch (error) {
      console.error('Error editing comment on server:', error);
      // Continue with UI update even if server update fails
    }
    
    // Update the comment in the state regardless of server success
    setComments(comments.map(comment => 
      comment.$id === commentId 
        ? { ...comment, content: editText.trim() } 
        : comment
    ));
    
    // Reset editing state
    setEditingComment(null);
    setEditText('');
  };

  // Handle delete comment
  const handleDeleteComment = async (commentId) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteComment(commentId);
              
              // Remove the comment from the state
              setComments(comments.filter(comment => comment.$id !== commentId));
            } catch (error) {
              console.error('Error deleting comment:', error);
              Alert.alert('Error', 'Failed to delete comment');
            }
          }
        }
      ]
    );
  };

  // Start editing a comment
  const startEditing = (comment) => {
    setEditingComment(comment.$id);
    setEditText(comment.content);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingComment(null);
    setEditText('');
  };

  // Add comment render item
  const renderComment = ({ item }) => {
    const isEditing = editingComment === item.$id;
    const isCurrentUser = item.userId === user?.$id;
    
    return (
      <View className="flex-row gap-3 p-3 bg-black-100 rounded-lg mb-2">
        <TouchableOpacity onPress={() => handleCommenterProfilePress(item.user.$id)}>
          <Image 
            source={{ uri: item.user?.avatar }} 
            className="w-8 h-8 rounded-full"
          />
        </TouchableOpacity>
        <View className="flex-1">
          <View className="flex-row justify-between items-center">
            <TouchableOpacity onPress={() => handleCommenterProfilePress(item.user.$id)}>
              <Text className="text-white font-pmedium text-sm">
                {item.user?.username}
              </Text>
            </TouchableOpacity>
            {isCurrentUser && !isEditing && (
              <View className="flex-row gap-2">
                <TouchableOpacity onPress={() => startEditing(item)}>
                  <Text className="text-blue-400 text-xs">Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteComment(item.$id)}>
                  <Text className="text-red-400 text-xs">Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          {isEditing ? (
            <View className="mt-2">
              <FormField
                title=""
                value={editText}
                placeholder="Edit your comment..."
                handleChangeText={setEditText}
                otherStyles="mb-0"
                multiline
                numberOfLines={2}
                className="bg-black-200 text-white p-2 rounded-lg"
              />
              <View className="flex-row justify-end gap-2 mt-2">
                <TouchableOpacity onPress={cancelEditing}>
                  <Text className="text-gray-400 text-xs">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleEditComment(item.$id)}>
                  <Text className="text-blue-400 text-xs">Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Text className="text-gray-100 font-pregular text-sm">
              {item.content}
            </Text>
          )}
          
          <Text className="text-gray-400 font-pregular text-xs mt-1">
            {new Date(item.$createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }
            )}
          </Text>
        </View>
      </View>
    );
  };

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postData = await getPostById(id);
        setPost(postData);
      } catch (error) {
        console.error('Error fetching post:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 bg-primary justify-center items-center">
        <Text className="text-white">Loading...</Text>
      </View>
    );
  }

  if (!post) {
    return (
      <View className="flex-1 bg-primary justify-center items-center">
        <Text className="text-white">Video not found</Text>
      </View>
    );
  }

  const { title, video, creator, prompt } = post;

  const handleVideoLoad = (status) => {
    if (status?.naturalSize?.width && status?.naturalSize?.height) {
      const ratio = status.naturalSize.width / status.naturalSize.height;
      setAspectRatio(isNaN(ratio) ? 16/9 : ratio);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-primary">
        <View className="gap-3 p-4 items-center flex-row">
            <TouchableOpacity onPress={handleUserProfilePress}>
                <View className="w-[46px] h-[46px] rounded-lg border border-secondary justify-center items-center">
                    <Image source={{ uri: creator.avatar }} className="w-full h-full rounded-lg" resizeMode='cover'/>
                </View>
            </TouchableOpacity>
            <View className="justify-center gap-y-1 flex-1 ml-3">
                <Text className="text-white font-psemibold text-xl" numberOfLines={1}>{title}</Text>
                <TouchableOpacity onPress={handleUserProfilePress}>
                    <Text className="text-gray-100 font-pregular text-sm" numberOfLines={1}>{creator.username}</Text>
                </TouchableOpacity>
            </View>
            <View className="pt-2">
                <Image source={icons.menu} className="w-5 h-5" resizeMode='contain' />
            </View>
        </View>
        

      <View className="justify-top">
        <Video
          source={{ uri: video }}
        //   style={{
        //     width: "100%",
        //     height: "50%",
        //   }}
          style={{
            aspectRatio: aspectRatio,
          }}
          resizeMode={ResizeMode.CONTAIN}
          useNativeControls
          shouldPlay
          onReadyForDisplay={handleVideoLoad}
          onError={(error) => console.error('Video Error:', error)}
        />
      </View>

      <View className="flex-1 px-4 pt-4">
        <Text className="text-white font-psemibold text-lg mb-4">
          Discussion ({comments.length})
        </Text>
        
        <FlatList
          data={comments}
          renderItem={renderComment}
          keyExtractor={item => item.$id}
          className="mb-4"
          inverted
        />
        
        <View className="flex-row gap-2 pb-4">
          <View className="flex-1">
            <FormField
              title=""
              value={newComment}
              placeholder="Add a comment..."
              handleChangeText={setNewComment}
              otherStyles="mb-0"
              multiline
              numberOfLines={2}
              className="bg-black-100 rounded-lg px-4 py-2 text-white"
            />
          </View>
          <TouchableOpacity
            onPress={handleSubmitComment}
            className="bg-secondary px-4 py-2 rounded-lg justify-center"
          >
            <Text className="text-white font-psemibold">Post</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default VideoPlayer; 