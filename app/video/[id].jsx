import { View, Text, Image, TouchableOpacity, SafeAreaView, FlatList, TextInput, Alert, Modal, ActivityIndicator, ScrollView } from 'react-native';
import React, { useState, useEffect, useRef, useCallback, memo, createContext, useReducer, useContext } from 'react';
import { ResizeMode, Video } from "expo-av";
import { useLocalSearchParams, useRouter } from 'expo-router';
import { icons } from '../../constants';
import { getPostById, getQuizByVideoId, saveQuizResult, addBookmark, removeBookmark, isPostBookmarked } from '../../lib/appwrite';
import { useGlobalContext } from '../../context/GlobalProvider';
import { getCommentsByPostId, createComment, editComment, deleteComment } from '../../lib/appwrite';
import FormField from '../../components/FormField';

// Create a context for quiz answers at the top of the file
const QuizContext = React.createContext();

// Create a reducer for managing answers
const answersReducer = (state, action) => {
  switch (action.type) {
    case 'SET_ANSWER':
      return {
        ...state,
        [action.questionIndex]: action.answer
      };
    case 'RESET':
      return {};
    default:
      return state;
  }
};

const VideoPlayer = () => {
  // 1. First, declare all useState hooks
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useGlobalContext();
  const videoRef = useRef(null);
  
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aspectRatio, setAspectRatio] = useState(16/9);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState(null);
  
  // Quiz-related states
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [quizId, setQuizId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [showSubmit, setShowSubmit] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  // 2. Then, declare all useEffects
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // First fetch post data
        const postData = await getPostById(id);
        setPost(postData);

        if (postData) {
          // Only check bookmark status if we have post data
          const { isBookmarked, bookmarkId } = await isPostBookmarked(postData.$id);
          setIsBookmarked(isBookmarked);
          setBookmarkId(bookmarkId);

          // Load comments
          const postComments = await getCommentsByPostId(postData.$id);
          setComments(postComments);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [id]);

  // 3. Then, declare all your handlers
  const handleBookmark = async () => {
    if (!post) return;
    
    try {
      if (isBookmarked) {
        await removeBookmark(bookmarkId);
        setIsBookmarked(false);
        setBookmarkId(null);
      } else {
        const bookmark = await addBookmark(post.$id);
        setIsBookmarked(true);
        setBookmarkId(bookmark.$id);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const handleUserProfilePress = async () => {
    if (post?.creator?.$id) {
      // Pause video if it exists
      if (videoRef.current) {
        await videoRef.current.pauseAsync();
      }
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
      <View className="flex-row gap-3 p-4 bg-black-100 rounded-3xl mb-3">
        <TouchableOpacity onPress={() => handleCommenterProfilePress(item.user.$id)}>
          <Image 
            source={{ uri: item.user?.avatar }} 
            className="w-8 h-8 rounded-full"
          />
        </TouchableOpacity>
        <View className="flex-1">
          <View className="flex-row justify-between items-center">
            <TouchableOpacity onPress={() => handleCommenterProfilePress(item.user.$id)}>
              <Text className="text-gray-400 font-pmedium text-sm">
                {item.user?.username}
              </Text>
            </TouchableOpacity>
            {isCurrentUser && !isEditing && (
              <View className="flex-row gap-2">
                <TouchableOpacity onPress={() => startEditing(item)}>
                <Image source={icons.edit} className="w-7 h-7" resizeMode='contain' />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteComment(item.$id)}>
                <Image source={icons.deleteIcon} className="w-7 h-7" resizeMode='contain' />
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          {isEditing ? (
            <View className="mt-2">
              <TextInput
                value={editText}
                onChangeText={setEditText}
                placeholder="Edit your comment..."
                placeholderTextColor="#666"
                multiline
                numberOfLines={2}
                className="bg-black-200 text-white p-2 rounded-lg"
                style={{ color: 'white' }}
              />
              <View className="flex-row justify-end gap-2 mt-2">
                <TouchableOpacity onPress={cancelEditing}>
                  <Text className="text-gray-400 text-sm">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleEditComment(item.$id)}>
                  <Text className="text-blue-400 text-sm">Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Text className="text-gray-100 font-pregular text-lg">
              {item.content}
            </Text>
          )}
          
          <Text className="text-gray-500 font-pregular text-xs mt-1">
          {new Date(item.$createdAt).toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          })}
          </Text>
        </View>
      </View>
    );
  };

  // Function to fetch and prepare quiz questions
  const handleStartQuiz = async () => {
    // Check if user is educator
    if (user?.role === 'educator') {
      Alert.alert(
        "Access Restricted",
        "Quiz feature is only available for students"
      );
      return;
    }

    setLoadingQuiz(true);
    try {
      if (videoRef.current) {
        await videoRef.current.pauseAsync();
      }

      const quizData = await getQuizByVideoId(id);
      const { quizId, questions } = quizData;
      
      setQuizId(quizId);
      
      const shuffled = questions.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, Math.min(10, shuffled.length));
      
      setQuizQuestions(selected);
      setAnswers({}); // Reset answers
      setScore(0);
      setQuizCompleted(false);
      setShowQuiz(true);
    } catch (error) {
      console.error('Error fetching quiz:', error);
      Alert.alert('Error', 'Failed to load quiz questions');
    } finally {
      setLoadingQuiz(false);
    }
  };

  // Add this function to save results when quiz is completed
  const handleQuizComplete = async () => {
    try {
      await saveQuizResult(id, quizId, score, quizQuestions.length);
    } catch (error) {
      console.error('Error saving quiz result:', error);
      // Don't alert the user, as this is not critical to their experience
    }
    setQuizCompleted(true);
  };

  // New function to handle individual answer selection
  const handleAnswerSelect = (questionIndex, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  // New function to check if all questions are answered
  const areAllQuestionsAnswered = () => {
    return quizQuestions.length === Object.keys(answers).length;
  };

  // New function to handle quiz submission
  const handleSubmitQuiz = async () => {
    if (!areAllQuestionsAnswered()) {
      Alert.alert('Warning', 'Please answer all questions before submitting');
      return;
    }

    let totalScore = 0;
    quizQuestions.forEach((question, index) => {
      const userAnswer = answers[index];
      const correctAnswer = JSON.parse(question.answer);
      if (userAnswer === correctAnswer) {
        totalScore += 1;
      }
    });

    // First set the score
    setScore(totalScore);
    
    // Then save the quiz result with the actual score
    try {
      await saveQuizResult(id, quizId, totalScore, quizQuestions.length);
      setQuizCompleted(true);
    } catch (error) {
      console.error('Error saving quiz result:', error);
      Alert.alert('Error', 'Failed to save quiz results');
    }
  };

  // Create a memoized option component
  const QuizOption = React.memo(({ option, isSelected, onSelect }) => (
    <TouchableOpacity
      className={`p-4 rounded-2xl my-1.5 ${
        isSelected ? 'bg-secondary' : 'bg-black-200'
      }`}
      onPress={onSelect}
    >
      <Text className="text-white text-center">{option}</Text>
    </TouchableOpacity>
  ));

  const QuizQuestion = ({ question, index }) => {
    const { answers, handleAnswerSelect } = useContext(QuizContext);
    const selectedAnswer = answers[index];
    const isTrue = question.type === 'true-false';
    
    let options = [];
    try {
      options = JSON.parse(question.options);
    } catch (error) {
      console.error('Error parsing options:', error);
      options = [];
    }

    return (
      <View className="mb-8">
        <Text className="text-white text-lg mb-4">
          {index + 1}. {question.question}
        </Text>

        <View className="space-y-4">
          {(isTrue ? ['True', 'False'] : options).map((option, optionIndex) => (
            <QuizOption
              key={`option-${optionIndex}`}
              option={option}
              isSelected={selectedAnswer === option}
              onSelect={() => handleAnswerSelect(index, option)}
            />
          ))}
        </View>
      </View>
    );
  };

  const MemoizedQuizQuestion = React.memo(QuizQuestion);

  const QuizModal = React.memo(() => {
    const scrollViewRef = useRef(null);
    const [answersState, dispatch] = useReducer(answersReducer, {});

    const handleAnswerSelect = useCallback((questionIndex, answer) => {
      dispatch({ type: 'SET_ANSWER', questionIndex, answer });
    }, []);

    const areAllQuestionsAnswered = useCallback(() => {
      return quizQuestions.length === Object.keys(answersState).length;
    }, [quizQuestions.length, answersState]);

    if (loadingQuiz) {
      return (
        <Modal
          transparent={true}
          visible={showQuiz}
          animationType="slide"
        >
          <View className="flex-1 justify-center items-center bg-black/90">
            <ActivityIndicator size="large" color="#6366F1" />
            <Text className="text-white mt-4">Loading quiz...</Text>
          </View>
        </Modal>
      );
    }

    if (quizCompleted) {
      return (
        <Modal
          transparent={true}
          visible={showQuiz}
          animationType="slide"
        >
          <View className="flex-1 justify-center items-center bg-black/90">
            <View className="bg-black-100 p-6 rounded-3xl w-[90%]">
              <Text className="text-white text-2xl font-psemibold text-center mb-4">
                Quiz Completed!
              </Text>
              <Text className="text-white text-xl text-center mb-6">
                Your Score: {score}/{quizQuestions.length}
              </Text>
              <TouchableOpacity 
                className="bg-secondary py-3 rounded-2xl"
                onPress={() => {
                  setShowQuiz(false);
                  setQuizCompleted(false);
                }}
              >
                <Text className="text-white text-center font-pmedium">Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      );
    }

    const handleSubmitQuizLocal = async () => {
      if (!areAllQuestionsAnswered()) {
        Alert.alert('Warning', 'Please answer all questions before submitting');
        return;
      }

      let totalScore = 0;
      quizQuestions.forEach((question, index) => {
        const userAnswer = answersState[index];
        const correctAnswer = JSON.parse(question.answer);
        if (userAnswer === correctAnswer) {
          totalScore += 1;
        }
      });

      setScore(totalScore);
      
      try {
        await saveQuizResult(id, quizId, totalScore, quizQuestions.length);
        setQuizCompleted(true);
      } catch (error) {
        console.error('Error saving quiz result:', error);
        Alert.alert('Error', 'Failed to save quiz results');
      }
    };

    return (
      <Modal
        transparent={false}
        visible={showQuiz}
        animationType="slide"
      >
        <QuizContext.Provider value={{ answers: answersState, handleAnswerSelect }}>
          <View className="flex-1 bg-black/90">
            <View className="flex-row justify-between items-center px-4 py-4">
              <TouchableOpacity 
                onPress={() => {
                  setShowQuiz(false);
                  dispatch({ type: 'RESET' });
                }}
                className="p-2"
              >
                <Text className="text-gray-400 font-pmedium">Cancel</Text>
              </TouchableOpacity>
              <Text className="text-white text-xl font-psemibold">Quiz</Text>
              <View style={{ width: 50 }}>
                <Text> </Text>
              </View>
            </View>

            <ScrollView 
              ref={scrollViewRef}
              className="flex-1 px-4"
              maintainPosition={true}
              maintainVisibleContentPosition={{
                minIndexForVisible: 0,
              }}
            >
              <View className="bg-black-100 p-6 rounded-3xl">              
                {quizQuestions.map((question, index) => (
                  <MemoizedQuizQuestion
                    key={`question-${index}`}
                    question={question}
                    index={index}
                  />
                ))}

                <TouchableOpacity
                  className={`py-4 rounded-2xl mt-6 ${
                    areAllQuestionsAnswered() ? 'bg-secondary' : 'bg-gray-600'
                  }`}
                  onPress={handleSubmitQuizLocal}
                  disabled={!areAllQuestionsAnswered()}
                >
                  <Text className="text-white text-center font-pmedium">
                    Submit Quiz
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </QuizContext.Provider>
      </Modal>
    );
  });

  const TranscriptModal = memo(() => {
    return (
      <Modal
        transparent={false}
        visible={showTranscript}
        animationType="slide"
      >
        <View className="flex-1 bg-black/90">
          <View className="flex-row justify-between items-center px-4 py-4">
            <TouchableOpacity 
              onPress={() => setShowTranscript(false)}
              className="p-2"
            >
              <Text className="text-gray-400 font-pmedium">Close</Text>
            </TouchableOpacity>
            <Text className="text-white text-xl font-psemibold">Transcript</Text>
            <View style={{ width: 50 }} />
          </View>

          <ScrollView className="flex-1 px-4">
            <View className="bg-black-100 p-6 rounded-3xl">
              <Text className="text-white text-lg leading-7">
                {post?.transcript || 'No transcript available'}
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  });

  // 4. Finally, return your JSX
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
      <ScrollView className="">
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
          {user?.role !== 'educator' && (
            <TouchableOpacity onPress={handleStartQuiz}>
              <Image source={icons.quiz} className="w-10 h-10" resizeMode='contain' />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleBookmark}>
            <Image 
              source={isBookmarked ? icons.bookmarkFilled : icons.notBookMarked} 
              className="w-10 h-10" 
              resizeMode='contain' 
            />
          </TouchableOpacity>
        </View>

        <View>
          <Video
            ref={videoRef}
            source={{ uri: video }}
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
        
        <View className="flex-row items-center">
          <Text className="flex-1 font-psemibold text-lg bg-gray-500 border border-gray-500 rounded-2xl mx-4 my-3 p-3">
            {prompt}
          </Text>
          <TouchableOpacity 
            onPress={() => setShowTranscript(true)}
            className="mr-4"
          >
            <Image 
              source={icons.transcript}
              className="w-10 h-10" 
              resizeMode='contain' 
            />
          </TouchableOpacity>
        </View>

        <View className="px-4 pt-1">
          <Text className="text-gray-400 font-psemibold text-lg mb-4">
            Discussion ({comments.length})
          </Text>
          
          {/* Replace FlatList with manual mapping of comments */}
          <View style={{marginBottom:95}}>
            {comments.map((item) => (
              <View key={item.$id}>
                {renderComment({ item })}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Fixed comment input at bottom */}
      <View className="absolute bottom-0 left-0 right-0 bg-primary px-4 pb-3 border-t border-gray-800">
        <View className="flex-row gap-2 items-end">
          <View className="flex-1">
            <FormField
              title=""
              value={newComment}
              placeholder="Add a comment..."
              handleChangeText={setNewComment}
              otherStyles="rounded-full"
              multiline
              numberOfLines={2}
              className="bg-black-100 rounded-full items-bottom text-white"
            />
          </View>
          <TouchableOpacity
            onPress={handleSubmitComment}
            className="rounded-lg h-16 justify-center"
          >
            <Image source={icons.send} className="w-14 h-14" resizeMode='cover' />
          </TouchableOpacity>
        </View>
      </View>
      
      <QuizModal />
      <TranscriptModal />
    </SafeAreaView>
  );
};

export default VideoPlayer;
