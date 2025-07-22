import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { db } from "./firebase";
import { doc, setDoc } from "firebase/firestore";

const auth = getAuth();

// Sign up and create user document
export async function signUp(
  email,
  password,
  name,
  role,
  assignedPharmacy = null
) {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  const user = userCredential.user;
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    name,
    email,
    role,
    assignedPharmacy,
  });
  return user;
}

// Sign in
export async function signIn(email, password) {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );
  return userCredential.user;
}

// Sign out
export async function logout() {
  await signOut(auth);
}
