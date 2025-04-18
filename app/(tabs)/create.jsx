import { useState, useEffect } from "react";
import { router } from "expo-router";
import { ResizeMode, Video } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  Alert,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
} from "react-native";

import { icons } from "../../constants";
import { 
  createVideoPost, 
  createQuizCollection, 
  createQuizQuestion 
} from "../../lib/appwrite";
import CustomButton from "../../components/CustomButton";
import FormField from "../../components/FormField";
import { useGlobalContext } from "../../context/GlobalProvider";

const Create = () => {
  const { user } = useGlobalContext();
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    video: null,
    thumbnail: null,
    prompt: "",
  });
  const [uploadProgress, setUploadProgress] = useState('');

  // Check if user has educator role
  useEffect(() => {
    if (user?.role !== 'educator') {
      Alert.alert("Access Denied", "Only educators can create videos");
      router.replace("/home");
    }
  }, [user]);

  const openPicker = async (selectType) => {
    
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: selectType === "image" ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      if (selectType === "image") {
        setForm({
          ...form,
          thumbnail: result.assets[0],
        });
      }

      if (selectType === "video") {
        setForm({
          ...form,
          video: result.assets[0],
        });
      }
    } else {
      setTimeout(() => {
        Alert.alert("Document picked", JSON.stringify(result, null, 2));
      }, 100);
    }
  };

  // Add loading overlay component
  const LoadingOverlay = () => (
    <Modal
      transparent={true}
      animationType="fade"
      visible={uploading}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-primary p-6 rounded-2xl items-center">
          <ActivityIndicator size="large" color="#6366F1" />
          <Text className="text-white font-pmedium mt-4 text-center">
            {uploadProgress || 'Processing your video...'}
          </Text>
        </View>
      </View>
    </Modal>
  );

  const submit = async () => {
    if ((form.prompt === "") | (form.title === "") | !form.thumbnail | !form.video) {
      return Alert.alert("Please provide all fields");
    }

    setUploading(true);
    try {
      setUploadProgress('Creating video post...');
      
      // Create FormData for video upload
      const formData = new FormData();
      formData.append('video', {
        uri: form.video.uri,
        name: 'video.mp4',
        type: 'video/mp4'
      });

      setUploadProgress('Generating transcript and quiz questions...');
      // Send video to Flask server for transcript and quiz generation
      const flaskResponse = await fetch('http://192.168.138.35:5000/generate-transcript', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const transcriptData = await flaskResponse.json();
      if (!flaskResponse.ok) {
        throw new Error(
          transcriptData.details || transcriptData.error || 'Transcript generation failed'
        );
      }

      setUploadProgress('Uploading video and thumbnail...');
      // First create the video post
      const newPost = await createVideoPost({
        ...form,
        userId: user.$id,
      });

      setUploadProgress('Creating quiz collection...');
      // Create quiz collection associated with the video
      const quizCollection = await createQuizCollection(newPost.$id);

      setUploadProgress('Generating quiz questions...');
      // Create quiz questions
      const questions = transcriptData.quiz_questions;
      const questionPromises = questions.map(questionData => 
        createQuizQuestion(
          quizCollection.$id,
          {
            type: questionData.type,
            question: questionData.question,
            options: questionData.options,
            answer: questionData.answer,
            correct_statement: questionData.correct_statement
          },
          questionData.order
        )
      );

      // Wait for all questions to be created
      await Promise.all(questionPromises);

      Alert.alert(
        "Success", 
        "Post uploaded successfully with quiz questions"
      );
      router.push("/home");

    } catch (error) {
      console.error("Error in submit:", error);
      Alert.alert("Error", error.message);
    } finally {
      setForm({
        title: "",
        video: null,
        thumbnail: null,
        prompt: "",
      });
      setUploading(false);
      setUploadProgress('');
    }
  };

  return (
    <SafeAreaView className="bg-primary h-full">
      <ScrollView className="px-4 my-6">
        <Text className="text-2xl text-white font-psemibold">Upload Video</Text>

        <FormField
          title="Video Title"
          value={form.title}
          placeholder="Give your video a catchy title..."
          handleChangeText={(e) => setForm({ ...form, title: e })}
          otherStyles="mt-10"
        />

        <View className="mt-7 space-y-2">
          <Text className="text-base text-gray-100 font-pmedium mb-1.5">
            Upload Video
          </Text>

          <TouchableOpacity onPress={() => openPicker("video")}>
            {form.video ? (
              <Video
                source={{ uri: form.video.uri }}
                // className="w-full h-64 rounded-2xl"
                style={{
                  width: "100%",
                  height: 256,
                  borderRadius: 16,
                }}
                useNativeControls
                resizeMode={ResizeMode.COVER}
                isLooping
                shouldPlay
              />
            ) : (
              <View className="w-full h-40 px-4 bg-black-100 rounded-2xl border border-black-200 flex justify-center items-center">
                <View className="w-14 h-14 border border-dashed border-secondary-100 flex justify-center items-center">
                  <Image
                    source={icons.upload}
                    resizeMode="contain"
                    alt="upload"
                    className="w-1/2 h-1/2"
                  />
                </View>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View className="mt-7 space-y-2">
          <Text className="text-base text-gray-100 font-pmedium mb-1.5">
            Thumbnail Image
          </Text>

          <TouchableOpacity onPress={() => openPicker("image")}>
            {form.thumbnail ? (
              <Image
                source={{ uri: form.thumbnail.uri }}
                resizeMode="cover"
                className="w-full h-64 rounded-2xl"
              />
            ) : (
              <View className="w-full h-16 px-4 bg-black-100 rounded-2xl border-2 border-black-200 flex justify-center items-center flex-row space-x-2">
                <Image
                  source={icons.upload}
                  resizeMode="contain"
                  alt="upload"
                  className="w-5 h-5 mr-1.5"
                />
                <Text className="text-sm text-gray-100 font-pmedium">
                  Choose a file
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <FormField
          title="AI Prompt"
          value={form.prompt}
          placeholder="The AI prompt of your video...."
          handleChangeText={(e) => setForm({ ...form, prompt: e })}
          otherStyles="mt-7"
        />

        <CustomButton
          title="Submit & Publish"
          handlePress={submit}
          containerStyles="mt-7"
          isLoading={uploading}
        />
      </ScrollView>
      <LoadingOverlay />
    </SafeAreaView>
  );
};

export default Create;
