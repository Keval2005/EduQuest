import { Text, View, ScrollView, Image, Alert } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import images from '../../constants/images'
import FormField from '../../components/FormField'
import CustomButtom from '../../components/CustomButton'
import { useState } from 'react'
import '../../global.css';
import { Link, router } from 'expo-router'
import { createUser } from '../../lib/appwrite'
import {Picker} from '@react-native-picker/picker';

import { useGlobalContext } from "../../context/GlobalProvider";

const SignUp = () => {

  const { setUser, setIsLogged } = useGlobalContext();

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'student' // Default value
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = async () => {
      if(!form.username || !form.email || !form.password || !form.role){
          Alert.alert('Error','All fields are required')
      }

      setIsSubmitting(true)

      try{
          const result = await createUser(form.email, form.password, form.username, form.role)
          setUser(result);
          setIsLogged(true) //set the user to the global state

          //set it to the global state
          router.replace('/home')
      }catch(error){
          Alert.alert('Error', error.message)
      }finally{
          setIsSubmitting(false)
      }
      // createUser()
  };

  return (
    <SafeAreaView className="bg-primary h-full justify-center">
      <ScrollView>
        <View className="justify-center w-full min-h-[83vh] px-5 my-6">
          <Image 
            source={images.logo}
            resizeMode='contain'
            className="w-[115px] h-[35px]"
          />
          <Text className='text-2xl text-white text-semibold mt-10 font-psemibold'>Sign Up to Aora</Text>

          <FormField
            title='Username'
            value={form.username}
            handleChangeText={(e) => setForm({...form, username: e})}
            otherStyles='mt-10'
          />

          <FormField
            title='Email'
            value={form.email}
            handleChangeText={(e) => setForm({...form, email: e})}
            otherStyles='mt-7'
            keyBoardType='email-address'
          />
          <FormField
            title='Password'
            value={form.password}
            handleChangeText={(e) => setForm({...form, password: e})}
            otherStyles='mt-7'
          />

          <View className="mt-7 bg-black-200 rounded-2xl">
            <Picker
              selectedValue={form.role}
              onValueChange={(value) => setForm({...form, role: value})}
              style={{color: 'white'}}
            >
              <Picker.Item label="Student" value="student" />
              <Picker.Item label="Educator" value="educator" />
            </Picker>
          </View>

          <CustomButtom
            title='Sign Up'
            handlePress={submit}
            containerStyles="mt-7"
            isLoading={isSubmitting}

          />

          <View className="flex-row justify-center pt-5 gap-2">
            <Text className="text-lg font-pregular text-gray-100">
              Have an account already?
            </Text>
            <Link href="/sign-in" className='font-psemibold text-lg text-secondary'>Sign In</Link>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default SignUp
