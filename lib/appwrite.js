import { Client, Account, Avatars, Databases, ID, Query, Storage } from 'react-native-appwrite';
export const config = {
    endpoint: 'https://cloud.appwrite.io/v1',
    plateform: 'com.example.demo',
    projectId: '67daf0cc0029a2c020d8',
    databaseId: '67daf7480039a84461d1',
    userCollectionId: '67daf7ea0033a4d76169',
    videoCollectionId: '67daf7970021ad89f1dc',
    commentCollectionId: '67fbf300000494043585',
    storageId: '67dafbe000194cfb54e7',
    quizCollectionId: '67fcebac0018b1f08971',
    quizQuestionsCollectionId: '67ff7a770020d3ab69ec',
    userQuizResultsCollectionId: '67ff7799001bc59375c6'
}

const { 
    endpoint, 
    plateform, 
    projectId, 
    databaseId, 
    userCollectionId, 
    videoCollectionId, 
    storageId, 
    commentCollectionId,
    quizCollectionId,
    quizQuestionsCollectionId,
    userQuizResultsCollectionId 
} = config;

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
const storage = new Storage(client);

export const createUser = async (email, password, username, role) => {
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
            username,
            role
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
                role: role // Add role field
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
            [Query.orderDesc("$createdAt")]
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
    try {
        const posts = await databases.listDocuments(
            config.databaseId,
            config.videoCollectionId,
            [
                Query.equal('creator', userId)
            ]
        )
        return posts.documents;
    } catch (error) {
        throw new Error(error);
    }
}

export const getPostById = async (postId) => {
    try {
        const post = await databases.getDocument(
            config.databaseId,
            config.videoCollectionId,
            postId
        );
        return post;
    } catch (error) {
        throw new Error(error);
    }
}

export const getUserById = async (userId) => {
    try {
        const user = await databases.getDocument(
            config.databaseId,
            config.userCollectionId,
            userId
        );
        return user;
    } catch (error) {
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

export const getFilePreview = async (fileId, type) => {
    let fileUrl;
    try{
        // if(type === 'video'){
        //     fileUrl = storage.getFileView(storageId, fileId);
        // }
        // else if(type === 'image'){
        //     fileUrl = storage.getFilePreview(storageId, fileId);
        // }
        // else{
        //     throw new Error('Invalid file type');
        // }

        // Use getFileView for both video and image to avoid transformations
        fileUrl = storage.getFileView(storageId, fileId);

        if(!fileUrl) throw Error;

        // Convert the URL object to a string if needed
        return fileUrl.toString();
    }
    catch(error){
        throw new Error(error);
    }    
}

export const uploadFile = async (file, type) => {
    if(!file) return;

    
    const asset = {
        name: file.fileName,
        type: file.mimeType,
        size: file.fileSize,
        uri: file.uri
    };

    try{
        const uploadedFile = await storage.createFile(
            storageId,
            ID.unique(),
            asset
        );

        const fileUrl = await getFilePreview(uploadedFile.$id, type); 
        return fileUrl;
    }
    catch(error){
        throw new Error(error);
    }
}

export const createVideoPost = async (form) => {
    try{
        const [thumbnailUrl, videoUrl] = await Promise.all([
            uploadFile(form.thumbnail, 'image'),
            uploadFile(form.video,'video')
        ])

        const newPost = await databases.createDocument(
            databaseId,
            videoCollectionId,
            ID.unique(),
            {
                title: form.title,
                thumbnail: thumbnailUrl,
                video: videoUrl,
                prompt: form.prompt,
                creator: form.userId,
            }
        )

        return newPost;
    }
    catch(error){
        throw new Error(error);
    }
}

// Get comments for a post
export async function getCommentsByPostId(postId) {
  try {
    const comments = await databases.listDocuments(
      databaseId,
      commentCollectionId, // Your new collection ID
      [Query.equal("postId", postId), Query.orderDesc("$createdAt")]
    );
    
    // Fetch user information for each comment
    const commentsWithUserInfo = await Promise.all(
      comments.documents.map(async (comment) => {
        try {
          // First try to get user by accountId
          let userInfo = await databases.listDocuments(
            databaseId,
            userCollectionId,
            [Query.equal("accountId", comment.userId)]
          );
          
          // If no user found, try to get user by $id
          if (userInfo.documents.length === 0) {
            try {
              userInfo = await databases.listDocuments(
                databaseId,
                userCollectionId,
                [Query.equal("$id", comment.userId)]
              );
            } catch (idError) {
              console.error("Error fetching user by ID:", idError);
            }
          }
          
          // Add user info to comment
          if (userInfo.documents.length > 0) {
            return {
              ...comment,
              user: {
                username: userInfo.documents[0].username,
                avatar: userInfo.documents[0].avatar,
                $id: userInfo.documents[0].$id
              }
            };
          } else {
            console.warn(`No user found for comment ${comment.$id} with userId ${comment.userId}`);
            return comment;
          }
        } catch (error) {
          console.error("Error fetching user info for comment:", error);
          return comment;
        }
      })
    );
    
    return commentsWithUserInfo;
  } catch (error) {
    throw new Error(error);
  }
}
  
// Create comment
export async function createComment(postId, userId, content) {
  try {
    // First, get the user document to ensure we have the correct ID
    let userDocId = userId;
    
    try {
      // Try to get user by accountId
      const userInfo = await databases.listDocuments(
        databaseId,
        userCollectionId,
        [Query.equal("accountId", userId)]
      );
      
      if (userInfo.documents.length > 0) {
        // Use the document ID instead of account ID
        userDocId = userInfo.documents[0].$id;
      }
    } catch (userError) {
      console.error("Error fetching user for comment:", userError);
      // Continue with the original userId if there's an error
    }
    
    const newComment = await databases.createDocument(
      databaseId,
      commentCollectionId,
      ID.unique(),
      {
        postId,
        userId: userDocId, // Use the document ID
        content,
        createdAt: new Date().toISOString()
      }
    );
    return newComment;
  } catch (error) {
    throw new Error(error);
  }
}

// Edit comment
export async function editComment(commentId, content) {
  try {
    const updatedComment = await databases.updateDocument(
      databaseId,
      commentCollectionId,
      commentId,
      {
        content
      }
    );
    return updatedComment;
  } catch (error) {
    throw new Error(error);
  }
}

// Delete comment
export async function deleteComment(commentId) {
  try {
    await databases.deleteDocument(
      databaseId,
      commentCollectionId,
      commentId
    );
    return true;
  } catch (error) {
    throw new Error(error);
  }
}

// Create Quiz Collection
export const createQuizCollection = async (videoId) => {
  return await databases.createDocument(
    databaseId, 
    quizCollectionId,
    ID.unique(),
    {
      videoId,
      createdAt: new Date().toISOString(),
      stats: {
        attempts: 0,
        averageScore: 0
      }
    }
  );
}

// Create Quiz Questions
export const createQuizQuestion = async (quizId, questionData, order) => {
  return await databases.createDocument(
    databaseId,
    quizQuestionsCollectionId,
    ID.unique(),
    {
      quizId,
      ...questionData,
      order,
      options: JSON.stringify(questionData.options)
    }
  );
}

// Initialize User Quiz Results
export const initializeUserResults = async (quizId, videoId) => {
  const user = await getCurrentUser();
  return await databases.createDocument(
    databaseId,
    userQuizResultsCollectionId,
    ID.unique(),
    {
      userId: user.$id,
      quizId,
      videoId,
      score: 0,
      totalQuestions: 50,
      timestamp: new Date().toISOString()
    }
  );
}