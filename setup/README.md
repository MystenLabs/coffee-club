🚀 Project Setup Guide
Follow these steps to set up and initialize the project:

1. 📦 Install Dependencies
   Navigate to the `setup` directory and install the necessary dependencies:

```bash
cd setup
pnpm install
```

2. 👤 Create a Cafe Owner
   Move to the `src` directory and run the script to create a Cafe Owner:

```bash
cd src
ts-node createCafeOwner.ts
```

This will print an output like the following:

```bash
Permission to Open Cafe: {
  ...
  objectId: '0xPERMISSIONS_TO_OPEN_CAFE_ID',
  ...
}
```

Copy the `objectId` and add it to your `.env` file as:

```bash
PERMISSIONS_TO_OPEN_CAFE_ID=0xPERMISSIONS_TO_OPEN_CAFE_ID
```

3. ☕ Create the Cafe
   Run the next script to create the Cafe and associated owner:

```bash
ts-node createCafe.ts
```

You’ll see output similar to this:

```bash
Cafe Owner: {
  ...
  objectId: '0xCAFE_OWNER_ID',
  ...
}
Cafe: {
  ...
  objectId: '0xCAFE_ID',
  ...
}
```

Add both `objectIds` to your `.env` file:

```bash
CAFE_OWNER_ID=0xCAFE_OWNER_ID
CAFE_ID=0xCAFE_ID
```

4. Open the Cafe

```bash
ts-node setCafeStatusByOnwer.ts
```
