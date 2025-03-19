import { Client, Account } from 'react-native-appwrite';
export const config = {
    endpoint: 'https://cloud.appwrite.io/v1',
    plateform: 'com.example.demo',
    projectId: '67daf0cc0029a2c020d8',
    databaseId: '67daf7480039a84461d1',
    userCollectionId: '67daf7970021ad89f1dc',
    videoCollectionId: '67daf7ea0033a4d76169',
    storageId: '67dafbe000194cfb54e7'
}

// Init your React Native SDK
const client = new Client();

client
    .setEndpoint(config.endpoint) // Your Appwrite Endpoint
    .setProject(config.projectId) // Your project ID
    .setPlatform(config.plateform) // Your application ID or bundle ID.
;

const account = new Account(client);

export const createUser = () => {

account.create(ID.unique(), 'me@example.com', 'password', 'Jane Doe')
    .then(function (response) {
        console.log(response);
    }, function (error) {
        console.log(error);
    });

}
