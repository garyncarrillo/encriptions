import './App.css';
import { useState } from 'react';

const MERU_SESSION ='meru_session';
const key ="meru_key";

// const PRIVATE_KEY_MERU = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAq9w1bQP9If/48zgPctqAGayz5CYBbSfEsdImJ4fhzqEl/5ZEmbu3WtBMcrR9T7uOHcHol42ZVjL7+tupP3Z4S7KO/QFAypkCo6AysNGLTBF0Gcs/ZO3yHWf/lPPvpv+ex0o8AbwkV2vIgTffdlQyZw5zUIVhCFQBm8q8/0UzvjhH4ULDL04Px8He7w9ENTgWXtJJXWYgxXkrvthhS99XEnInLMhhK+bU6E6VTbxN6jPMvF2xJVOlEILK6sw8gT+dSHYOi7Jvm1ZUVFCaq+rp11AnEqrBFkPK5DMdQcLAmvc93e1gBsN5r5NweeMRR9DQZufMFTPouXog/DELq5Ht7QIDAQAB"

function App() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  const  encodeBase64 = (data) => {
    data = JSON.stringify(data);
    return btoa(data);
  }

  const  decodeBase64 = (data) =>{
    return JSON.parse(atob(data));
  }



  async function generateKey() {
    const key = await crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"]
    );
    return key;
  }

  async function decryptData(key, iv, data) {
    const decoder = new TextDecoder();
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: new Uint8Array(iv),
      },
      key,
      new Uint8Array(data)
    );
  
    return decoder.decode(decryptedData);
  }

  async function encryptData(key, data) {
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12)); // Initialization vector
    const encodedData = encoder.encode(data);
  
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      encodedData
    );
  
    return {
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encryptedData)),
    };
  }

  const submitHandler = async() => {
    let object = { "name": name, "password": password }
    const encriptObject = encodeBase64(object)
    localStorage.setItem(MERU_SESSION, encriptObject);

    const encryptionKey = await generateKey();
    const jsonString = JSON.stringify(object);
    const encryptedData = await encryptData(encryptionKey, jsonString);
    
    localStorage.setItem(key, JSON.stringify(encryptedData));
    localStorage.setItem(`${key}_key`, JSON.stringify(await crypto.subtle.exportKey("jwk", encryptionKey)));
  }

  async function getDataFromLocalStorage() {
    const encryptedData = JSON.parse(localStorage.getItem(key));
    const keyData = JSON.parse(localStorage.getItem(`${key}_key`));
  
    if (encryptedData && keyData) {
      try {
        const encryptionKey = await crypto.subtle.importKey(
          "jwk",
          keyData,
          {
            name: "AES-GCM",
          },
          true,
          ["decrypt"]
        );
  
        const decryptedData = await decryptData(
          encryptionKey,
          encryptedData.iv,
          encryptedData.data
        );
  
        return JSON.parse(decryptedData);
      } catch (error) {
        console.error('Failed to decrypt data:', error);
      }
    } else {
      console.log('No data found in localStorage');
    }
  }


  const submitDecode = async() => {
    const data = localStorage.getItem(MERU_SESSION);
    const decodeData = decodeBase64(data)
    console.log('Decode:', decodeData);
    const result = await getDataFromLocalStorage();
    console.log(result);
  }


  return (
    <div className="App">
      <div >
        <h1>React App</h1>
        <br/>
        <input onChange={(event)=>setName(event.target.value)} type="text" placeholder="Enter your name" />
        <br/>
        <input onChange={(event)=>setPassword(event.target.value)} type="text" placeholder="Enter your password" />
        <br/>
        <button onClick={submitHandler}>Submit</button>
        <button onClick={submitDecode}>Decode</button>
      </div>
    </div>
  );
}

export default App;
