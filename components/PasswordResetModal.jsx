import React from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FormField from './FormField';
import { changePassword } from '../lib/appwrite';

const PasswordChangeModal = ({ visible, onClose }) => {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [form, setForm] = React.useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleChange = (field, value) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleClose = () => {
    setForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    onClose();
  };

  const handleSubmit = async () => {
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      Alert.alert("Error", "New passwords do not match");
      return;
    }

    setIsProcessing(true);
    try {
      await changePassword(form.currentPassword, form.newPassword);
      Alert.alert("Success", "Password changed successfully");
      handleClose();
    } catch (error) {
      Alert.alert("Error", "Failed to change password. Please check your current password and try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
    >
      <SafeAreaView className="flex-1 bg-primary">
        <View className="flex-row justify-between items-center px-4 py-4">
          <TouchableOpacity 
            onPress={handleClose}
            className="p-2"
          >
            <Text className="text-gray-400 font-pmedium">Cancel</Text>
          </TouchableOpacity>
          <Text className="text-white text-xl font-psemibold">Change Password</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView className="flex-1 px-4">
          <View className="bg-black-100 p-6 rounded-3xl">
            <FormField
              title="Current Password"
              value={form.currentPassword}
              handleChangeText={(text) => handleChange('currentPassword', text)}
              placeholder="Enter current password"
              otherStyles="mb-4"
              isPassword={true}
            />

            <FormField
              title="New Password"
              value={form.newPassword}
              handleChangeText={(text) => handleChange('newPassword', text)}
              placeholder="Enter new password"
              otherStyles="mb-4"
              isPassword={true}
            />

            <FormField
              title="Confirm Password"
              value={form.confirmPassword}
              handleChangeText={(text) => handleChange('confirmPassword', text)}
              placeholder="Confirm new password"
              otherStyles="mb-6"
              isPassword={true}
            />

            <TouchableOpacity 
              className={`py-4 rounded-2xl ${isProcessing ? 'bg-gray-600' : 'bg-secondary'}`}
              onPress={handleSubmit}
              disabled={isProcessing}
            >
              <Text className="text-white text-center font-pmedium">
                {isProcessing ? 'Changing Password...' : 'Change Password'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

export default PasswordChangeModal;


