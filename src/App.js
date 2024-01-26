import React, { useEffect, useState } from "react";

import { Amplify, Auth } from "aws-amplify";
import { Hub } from "aws-amplify/utils";
import { signInWithRedirect, signOut, getCurrentUser, fetchAuthSession } from "aws-amplify/auth";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.REACT_APP_POOL_ID,
      userPoolClientId: process.env.REACT_APP_CLIENT_ID,
      signUpVerificationMethod: "code",
      loginWith: {
        oauth: {
          domain:
            process.env.REACT_APP_DOMAIN,
          scopes: ["email", "openid"],
          redirectSignIn: [process.env.REACT_APP_SIGNIN_CALLBACK],
          redirectSignOut: [process.env.REACT_APP_SIGNOUT_CALLBACK],
          responseType: "code",
        },
      },
    },
  },
});

export default function App() {
  const [user, setUser] = useState(null);
  const [jwt, setJwt] = useState("");
  const getToken = async () => {
    const userAttributes = await fetchAuthSession();
    setJwt(userAttributes.tokens.accessToken.toString());
  }

  useEffect(() => {
    const unsubscribe = Hub.listen("auth", ({ payload }) => {
      switch (payload.event) {
        case "signInWithRedirect":
          getUser();
          break;
        case "signInWithRedirect_failure":
          console.log("An error has ocurred during the Oauth flow.");
          break;
      }
    });

    getUser();

    return unsubscribe;
  }, []);

  const getUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error(error);
      console.log("Not signed in");
    }
  };

  return user !== null ? (
    <div>
      <button onClick={() => signOut()}>Sign Out</button>
      <div>{user?.username}</div>
      <button onClick={getToken}>Get token</button>
      <div>{jwt}</div>
    </div>
    ) : (
    <div className="App">
      <button
        onClick={
          () =>
            signInWithRedirect(
              // sign in with federated user is not working yet
              // { provider: { custom: "Okta" } }
            )
        }
      >
        Log in
      </button>
    </div>
    );
}