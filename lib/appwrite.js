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

const { endpoint, plateform, projectId, databaseId, userCollectionId, videoCollectionId, storageId } = config;

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
        // Gracefully handle session deletion
        try {
            await account.deleteSessions();  // Only works if already authenticated
        } catch (deleteError) {
            // Ignore "Unauthorized" errors for guests
            if (deleteError.code !== 401) throw deleteError;
        }
        
        const session = await account.createEmailPasswordSession(email, password);

        return session;
        // Delete any existing session before creating a new one
    }catch (error) {
        throw new Error(error);
    }
}

export const getCurrentUser = async () => {
    try{
        const currentAccount = await account.get();

        if(!currentAccount) throw Error;

        const currentUser = await databases.listDocuments(
            config.databaseId,
            config.userCollectionId,
            [Query.equal('accountId', currentAccount.$id)]
        ) 

        if(!currentUser) throw Error;

        return currentUser.documents[0];
    }catch(error){
        console.log(error)
        return null;

    }
}

export const getAllPosts = async () => {
    try{
        const posts = await databases.listDocuments(
            databaseId,
            videoCollectionId,
        )
        return posts.documents;
    }
    catch (error) {
        throw new Error(error);
    }
}

export const getLatestPosts = async () => {
    try{
        const posts = await databases.listDocuments(
            databaseId,
            videoCollectionId,
            [Query.orderDesc("$createdAt"), Query.limit(7)]
        );
        return posts.documents;
    }
    catch (error) {
        throw new Error(error);
    }
}

export const searchPosts = async (query) => {
    try{
        const posts = await databases.listDocuments(
            databaseId,
            videoCollectionId,
            [Query.search('title', query)]
        );
        return posts.documents;
    }
    catch (error) {
        throw new Error(error);
    }
}

export const getUserPosts = async (userId) => {
    try{
        const posts = await databases.listDocuments(
            databaseId,
            videoCollectionId,
            [Query.equal('creator', userId)]
        );
        return posts.documents;
    }
    catch (error) {
        throw new Error(error);
    }
}

export const signOut = async () => {
    try{
        const session = await account.deleteSessions('current');
        return session;
    }
    catch(error){
        throw new Error(error);
    }
}
