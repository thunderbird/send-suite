import { serverUrl } from "./lib/const";
export async function createNewUser(email) {
  const createUserUrl = `${serverUrl}/api/users/`;
  const createUserFetchInfo = {
    mode: "cors",
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email,
    }),
  };

  const createUserResponse = await fetch(createUserUrl, createUserFetchInfo);

  if (!createUserResponse.ok) {
    console.log(`Unable to create user`);
    return null;
  }
  const { user } = await createUserResponse.json();
  console.log(user);
  return user;
}
