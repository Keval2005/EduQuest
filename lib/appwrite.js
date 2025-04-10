import { Client, Account, Avatars, Databases, ID, Query } from 'react-native-appwrite';
export const config = {
    endpoint: 'https://cloud.appwrite.io/v1',
    plateform: 'com.example.demo',
    projectId: '67daf0cc0029a2c020d8',
    databaseId: '67daf7480039a84461d1',
    userCollectionId: '67daf7ea0033a4d76169',
    videoCollectionId: '67daf7970021ad89f1dc',
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
const avatars = new Avatars(client);
const databases = new Databases(client);

export const createUser = async (email, password, username) => {
    try{
        // Check if user exists
        try {
            const exists = await account.get();
            if (exists) {
                throw new Error('User already exists');
            }
        } catch (e) {
            // User doesn't exist, continue with creation
        }

        const newAccount = await account.create(
            ID.unique(),
            email,
            password,
            username
        );

        if(!newAccount){
            throw new Error('Failed to create account');
        }

        const avatarUrl = avatars.getInitials(username)

        await signIn(email, password);

        const newUser = await databases.createDocument(
            config.databaseId,
            config.userCollectionId,
            ID.unique(),
            {
                accountId: newAccount.$id,
                email: email,
                username: username,
                avatar: avatarUrl,
            }
        )
        return newUser  
    }
    catch(error){
        console.log(error)
        throw new Error(error)
    }
}

export const signIn = async (email, password) => {
    try{

        // Delete existing sessions before creating a new one
        await account.deleteSessions();
        
        const session = await account.createEmailPasswordSession(email, password);

        return session;
        // Delete any existing session before creating a new one
    }catch (error) {
        throw new Error(error);
    }
}

export const getCurrentUser = async () => {
    try{
        const CurrentAccount = await account.get();

        if(!CurrentAccount) throw Error;

        const currentUser = await databases.getDocument(
            config.databaseId,
            config.userCollectionId,
            [Query.equal('accountId', CurrentAccount.$id)]
        ) 

        if(!currentUser) throw Error;

        return currentUser.documents[0];
    }catch{

    }
}