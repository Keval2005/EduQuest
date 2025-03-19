import { Text, View, TextInput, TouchableOpacity, Image } from 'react-native'
import React, { useState } from 'react'
import '../global.css';
import { icons } from '../constants';

const FormField = ( {title, value, placeholder, handleChangeText, otherStyles, ...props }) => {
  
    const [showPassowrd, setShowPassword] = useState(false)
    const [isFocused, setIsFocused] = useState(false)

    return (
    <View className={`space-y-2 ${otherStyles}`}>
      <Text className='text-base text-gray-100 font-pmedium mb-1.5 ml-1'>{title}</Text>

      <View className={`border-2  w-full h-16 px-4  bg-black-200  rounded-2xl flex-row  items-center ${isFocused ? 'border-secondary' : 'border-black-200'}`}>
         <TextInput
            className='flex-1 text-white font-psemibold text-base'
            value={value}
            placeholder={placeholder}
            placeholderTextColor='#7B7B8B'
            onChangeText={handleChangeText}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            secureTextEntry={ title === 'Password' && !showPassowrd }
        />

        {title === 'Password' && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassowrd)}>
            <Image source={!showPassowrd ? icons.eye : icons.eyeHide}
            className="w-6 h-6" resizeMode='contain' />
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

export default FormField
