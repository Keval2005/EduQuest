import { StyleSheet, Text, View, Image  } from 'react-native'
import { Tabs, Redirect } from 'expo-router'
import { icons } from '../../constants'
import '../../global.css';

const TabIcon = ({icon, color, name, focused}) => {
  return (
    <View className="justify-center items-center gap-1 flex-1">
      <Image 
        source={icon}
        resizeMode="contain"
        tintColor={color}
        className="w-6 h-6" />

      <Text className={`${focused? 'font-psemibold' : 'font-pregular'}`}
        style={{ fontSize: 10, color: color, width: '100%', textAlign: 'center' }}
        numberOfLines={1}>
        {name}
      </Text>
    </View>
  )
}

const TabsLayout = () => {

  return (
    <>
    <Tabs
      screenOptions={
        {
          tabBarShowLabel: false,
          tabBarActiveTintColor: '#FFA001',
          tabBarInactiveTintColor: '#CDCDE0',
          tabBarStyle:{
            backgroundColor: '#161622',
            borderCurve: 5,
            borderTopWidth: 1,
            borderTopColor: '#232533',
            height:'70',
            paddingTop: 15
          }
        }
      }
    >
      <Tabs.Screen 
        name="home"
        options={
          {
            title: "Home",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon 
                icon={ icons.home }
                color={color}
                name="Home"
                focused={focused} />
            )
          }
        } />

      <Tabs.Screen 
              name="bookmark"
              options={
                {
                  title: "Bookmark",
                  headerShown: false,
                  tabBarIcon: ({ color, focused }) => (
                    <TabIcon 
                      icon={ icons.bookmark }
                      color={color}
                      name="bookmark"
                      focused={focused} />
                  )
                }
              } />

              <Tabs.Screen 
                name="create"
                options={
                  {
                    title: "Create",
                    headerShown: false,
                    tabBarIcon: ({ color, focused }) => (
                      <TabIcon 
                        icon={ icons.plus }
                        color={color}
                        name="Create"
                        focused={focused} />
                    )
                  }
                } />

        <Tabs.Screen 
                name="profile"
                options={
                  {
                    title: "Profile",
                    headerShown: false,
                    tabBarIcon: ({ color, focused }) => (
                      <TabIcon 
                        icon={ icons.profile }
                        color={color}
                        name="Profile"
                        focused={focused} />
                    )
                  }
                } />


    </Tabs>
    </>
  )
}

export default TabsLayout