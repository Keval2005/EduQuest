import { View, Text } from 'react-native'
import React from 'react'
import { FlatList } from 'react-native'

const Trending = ({posts}) => {
  return (
    <FlatList
    data={posts}
    keyExtractor={(item) => item.$id}
    renderItem={({item}) => (
        <Text className='text-4xl text-white'>{item.id}</Text>
    )}
    horizontal/>
  )
}

export default Trending