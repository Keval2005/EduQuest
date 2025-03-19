import { Text, View, ScrollView, Image } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import images from '../../constants/images'
import FormField from '../../components/FormField'
import CustomButtom from '../../components/CustomButton'
import { useState } from 'react'
import '../../global.css';
import { Link } from 'expo-router'

const SignIn = () => {

  const [form, setForm] = useState({
    email: '',
    password: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = () => {

  }

  return (
    <SafeAreaView className="bg-primary h-full justify-center">
      <ScrollView>
        <View className="justify-center w-full min-h-[83vh] px-5 my-6">
          <Image 
            source={images.logo}
            resizeMode='contain'
            className="w-[115px] h-[35px]"
          />
          <Text className='text-2xl text-white text-semibold mt-10 font-psemibold'>Log in to Aora</Text>

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

          <CustomButtom
            title='Sign In'
            handlePress={submit}
            containerStyles="mt-7"
            isLoading={isSubmitting}

          />

          <View className="flex-row justify-center pt-5 gap-2">
            <Text className="text-lg font-pregular text-gray-100">
              Don't have an account?
            </Text>
            <Link href="/sign-up" className='font-psemibold text-lg text-secondary'>Sign Up</Link>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default SignIn
