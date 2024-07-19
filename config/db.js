import mongoose from 'mongoose';
const uri = "mongodb+srv://Examaker:YgJWtE4u6glDc9DW@cluster0.pkvrihx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };

let _db; // Variable to store the database reference

async function connectToDatabase() {
  if (_db) { // Check if the database is already connected
    return _db; 
  }

  try {
    await mongoose.connect(uri, clientOptions);
    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log(" You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    
}
}




// Export the function to connect to the database
export default connectToDatabase ;

