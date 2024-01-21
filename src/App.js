import React, { useEffect, useState } from "react";

import { Amplify, Auth } from "aws-amplify";
import { Hub } from "aws-amplify/utils";
import { signInWithRedirect, signOut, getCurrentUser, fetchAuthSession } from "aws-amplify/auth";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: "ap-southeast-1_uHIi7mkxG",
      userPoolClientId: "5ii9mpg8qqo6tbibltlmv9f51k",
      signUpVerificationMethod: "code",
      loginWith: {
        oauth: {
          domain:
            "linh-test.auth.ap-southeast-1.amazoncognito.com",
          scopes: ["email", "openid"],
          redirectSignIn: ["http://localhost:3000"],
          redirectSignOut: ["http://localhost:3000"],
          responseType: "token",
        },
      },
    },
  },
});

export default function App() {
  const [user, setUser] = useState(null);

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

  return user !== null ? (<AuthenticatedApp user={user}></AuthenticatedApp>) : (<UnauthenticatedApp />);
}

function UnauthenticatedApp() {
  return (
    <div>
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
    </div>
  );
}

function AuthenticatedApp({ user }) {
  
  const [jwt, setJwt] = useState("");
  const getToken = async () => {
    const userAttributes = await fetchAuthSession();
    setJwt(userAttributes.tokens.accessToken.toString());
  }
  return (
    <div>
      <button onClick={() => signOut()}>Sign Out</button>
      <div>{user?.username}</div>
      <button onClick={getToken}>Get token</button>
      <div>{jwt}</div>
    </div>
  );
}