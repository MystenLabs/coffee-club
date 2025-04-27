import { useState, useEffect } from 'react'
import { ConnectButton, useCurrentAccount, useSignAndExecuteTransaction, useSuiClient, useSuiClientQuery } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import './App.css'
import { COFFEE_CLUB_PACKAGE_ID, COFFEE_CLUB_OBJECT_ID, COFFEE_CLUB_CAFE_IDS } from './constants'
import { bcs } from '@mysten/bcs'
import { SuiObjectData, SuiObjectResponse } from '@mysten/sui/client'

// Remove the old constant for the cafe
// const COFFEE_CLUB_CAFE_ID = COFFEE_CLUB_OBJECT_ID; // Using the same ID as the club for now

// Define Interfaces for better type safety
interface CafeFields {
  name: string;
  location?: string;
  description?: string;
  manager?: string; // Add manager field if needed for display/logic
  // Add other fields from CoffeeCafe struct if needed
}

interface Cafe {
  objectId: string;
  data: SuiObjectData | null; // Use SuiObjectData type
  fields: CafeFields | null;
}

interface OrderFields {
  status: number;
  timestamp: string;
  statusLastUpdated: string;
  cafe: string;
  member: string;
  coffee_type?: any; // Add coffee_type if it exists in your struct
}

interface Order {
  objectId: string;
  data: SuiObjectData | null; // Use SuiObjectData type
  fields: OrderFields | null;
  txDigest?: string;
}

function App() {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [membershipId, setMembershipId] = useState<string | null>(null);
  const [cafeList, setCafeList] = useState<Cafe[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedCafe, setSelectedCafe] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('order');
  
  // Add states for role-based access
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCafeManager, setIsCafeManager] = useState(false);
  const [managerCapId, setManagerCapId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'guest' | 'member' | 'manager' | 'admin'>('guest');
  
  // Add this near the top with other state declarations
  const [selectedCoffeeType, setSelectedCoffeeType] = useState<string | null>(null);
  
  // Add state for managed cafes near other state declarations
  const [managedCafeList, setManagedCafeList] = useState<SuiObjectResponse[]>([]); // Use SuiObjectResponse directly
  
  // Add this constant for coffee types
  const COFFEE_TYPES = [
    {
      id: 'espresso',
      name: 'Espresso',
      icon: '☕',
      description: 'Strong, concentrated coffee'
    },
    {
      id: 'coffee',
      name: 'Coffee',
      icon: '🫖',
      description: 'Regular brewed coffee'
    },
    {
      id: 'americano',
      name: 'Americano',
      icon: '🌊',
      description: 'Espresso with hot water'
    },
    {
      id: 'long',
      name: 'Long Coffee',
      icon: '⏳',
      description: 'Longer extraction coffee'
    },
    {
      id: 'doppio',
      name: 'Doppio',
      icon: '⚡',
      description: 'Double shot espresso'
    }
  ];
  
  // Check if user has a membership
  const { data: memberData, isPending: memberLoading, refetch: refetchMembership } = 
    useSuiClientQuery("getOwnedObjects", {
      owner: currentAccount?.address || "",
      filter: {
        StructType: `${COFFEE_CLUB_PACKAGE_ID}::coffee_club::CoffeeMember`
      },
      options: {
        showContent: true
      }
    }, 
    { enabled: !!currentAccount?.address }
  );
  
  // Add logging to debug membership detection
  useEffect(() => {
    if (currentAccount?.address) {
      console.log("Checking membership for address:", currentAccount.address);
      console.log("Member data:", memberData);
    }
  }, [currentAccount?.address, memberData]);
  
  // Fetch cafes - update to handle multiple cafes
  const { data: cafesData, isPending: cafesLoading, refetch: refetchCafes } = 
    useSuiClientQuery("multiGetObjects", {
      ids: COFFEE_CLUB_CAFE_IDS,
      options: {
        showContent: true,
        showDisplay: true  // This might help get display information
      }
    });
    
  // Fetch orders - updated to query transaction blocks and events
  const { data: ordersData, isPending: ordersLoading, refetch: refetchOrders } = 
    useSuiClientQuery("queryTransactionBlocks", {
      filter: {
        FromAddress: currentAccount?.address || "",
      },
      options: {
        showEffects: true,
        showInput: true,
        showEvents: true, // Add this to get events data
      },
      limit: 50, // Adjust as needed
    },
    { enabled: !!currentAccount?.address }
  );
  
  // Add a query to fetch current order objects directly
  const { data: currentOrdersData, isPending: currentOrdersLoading, refetch: refetchCurrentOrders } = 
    useSuiClientQuery("getOwnedObjects", {
      owner: currentAccount?.address || "",
      filter: {
        StructType: `${COFFEE_CLUB_PACKAGE_ID}::coffee_club::CoffeeOrder`
      },
      options: {
        showContent: true,
        showDisplay: true,
        showOwner: true
      }
    },
    { enabled: !!currentAccount?.address }
  );
  
  // Add a query to fetch shared orders that might not be directly owned
  const { data: sharedOrdersData, isPending: sharedOrdersLoading, refetch: refetchSharedOrders } = 
    useSuiClientQuery("queryObjects", {
      query: {
        StructType: `${COFFEE_CLUB_PACKAGE_ID}::coffee_club::CoffeeOrder`
      },
      options: {
        showContent: true,
        showDisplay: true,
        showOwner: true
      },
      limit: 50
    });
  
  // Add a query to fetch all CoffeeOrder objects from the package
  const { data: allOrdersData, isPending: allOrdersLoading, refetch: refetchAllOrders } = 
    useSuiClientQuery("queryObjects", {
      query: {
        StructType: `${COFFEE_CLUB_PACKAGE_ID}::coffee_club::CoffeeOrder`
      },
      options: {
        showContent: true,
        showDisplay: true,
        showOwner: true
      },
      limit: 50
    });
  
  // Add query for CoffeeClubCap (admin capability)
  const { data: adminCapData, isPending: adminCapLoading, refetch: refetchAdminCap } = 
    useSuiClientQuery("getOwnedObjects", {
      owner: currentAccount?.address || "",
      filter: {
        StructType: `${COFFEE_CLUB_PACKAGE_ID}::coffee_club::CoffeeClubCap`
      },
      options: {
        showContent: true
      }
    }, 
    { enabled: !!currentAccount?.address }
  );
  
  // Add query for CoffeeClubManager (cafe manager capability)
  const { data: managerCapData, isPending: managerCapLoading, refetch: refetchManagerCap } = 
    useSuiClientQuery("getOwnedObjects", {
      owner: currentAccount?.address || "",
      filter: {
        StructType: `${COFFEE_CLUB_PACKAGE_ID}::coffee_club::CoffeeClubManager`
      },
      options: {
        showContent: true
      }
    }, 
    { enabled: !!currentAccount?.address }
  );
  
  // Add new query for OWEND CoffeeCafe objects
  const { data: ownedCafesData, isPending: ownedCafesLoading, refetch: refetchOwnedCafes } = 
    useSuiClientQuery('getOwnedObjects', {
      owner: currentAccount?.address || "",
      filter: {
        StructType: `${COFFEE_CLUB_PACKAGE_ID}::coffee_club::CoffeeCafe`
      },
      options: {
        showContent: true,
        showDisplay: true,
        // showOwner: true // Owner is implicitly the current user
      },
      limit: 50
    }, {
      enabled: !!currentAccount?.address && isCafeManager // Only fetch if user is a manager
    });
  
  // Update state when data is loaded
  useEffect(() => {
    // --- Process Membership --- 
    if (memberData?.data && memberData.data.length > 0) {
      const membershipObject = memberData.data[0];
      console.log("Membership object:", JSON.stringify(membershipObject, null, 2));
      console.log("Object ID:", membershipObject.data?.objectId);
      setMembershipId(membershipObject.data?.objectId ?? null); // Use nullish coalescing
    } else if (memberData) { // Check if memberData itself exists
      console.log("No membership found in data:", memberData);
      setMembershipId(null);
    }
    
    // --- Process General Cafe List (from constants) --- 
    if (cafesData) {
      console.log("Cafe data:", cafesData);
      const processedCafeList: Cafe[] = [];
      // Ensure cafesData.data is the array of SuiObjectResponse
      const cafeResponses = Array.isArray(cafesData) ? cafesData : cafesData.data;
      if (Array.isArray(cafeResponses)) {
        cafeResponses.forEach((cafeResp: SuiObjectResponse) => {
          if (cafeResp.data?.content?.dataType === 'moveObject') {
            const fields = cafeResp.data.content.fields as CafeFields;
            processedCafeList.push({
              objectId: cafeResp.data.objectId,
              data: cafeResp.data,
              fields: fields,
            });
            console.log("Added cafe to list:", fields.name);
          }
        });
      }
      setCafeList(processedCafeList);
    }
    
    // --- Process Orders --- 
    // Combine processing logic for all order sources if needed
    const combinedOrders: Order[] = [];
    // Example: Process currentOrdersData
    if (currentOrdersData?.data) {
       currentOrdersData.data.forEach((orderResp: SuiObjectResponse) => {
          if (orderResp.data?.content?.dataType === 'moveObject') {
            const fields = orderResp.data.content.fields as OrderFields;
            // Basic status processing - refine as needed
            let status = 0;
            if (typeof fields?.status === 'number') {
              status = fields.status;
            } else if (typeof fields?.status === 'object') {
              // Handle complex enum structures if necessary
               status = (fields.status as any)?.fields?.value ?? 0; 
            }

            combinedOrders.push({
              objectId: orderResp.data.objectId,
              data: orderResp.data,
              fields: {
                ...fields,
                status: status, // Use processed status
                statusLastUpdated: fields?.statusLastUpdated || orderResp.data.version || '0', // Provide defaults
                timestamp: fields?.timestamp || orderResp.data.version || '0'
              }
            });
          }
       });
    }
    // Add processing for ordersData, sharedOrdersData, allOrdersData similarly
    // ...
    // Sort and set orders
    combinedOrders.sort((a, b) => 
      (parseInt(b.fields?.timestamp ?? '0') || 0) - (parseInt(a.fields?.timestamp ?? '0') || 0)
    );
    setOrders(combinedOrders);

    // --- Process Managed Cafes (from ownedCafesData) --- 
    if (ownedCafesData?.data && isCafeManager) {
      // Directly use the data as it's already filtered by ownership
      setManagedCafeList(ownedCafesData.data);
      console.log("Owned cafes set for manager:", JSON.stringify(ownedCafesData.data, null, 2));
    } else {
      setManagedCafeList([]); // Reset if not manager or no data
    }
    
    // --- Process Roles --- 
    if (adminCapData?.data && adminCapData.data.length > 0) {
      console.log("Admin capability found:", adminCapData.data[0]);
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
    
    if (managerCapData?.data && managerCapData.data.length > 0) {
      console.log("Manager capability found:", managerCapData.data[0]);
      setIsCafeManager(true);
      setManagerCapId(managerCapData.data[0].data?.objectId ?? null); // Use nullish coalescing
    } else {
      setIsCafeManager(false);
      setManagerCapId(null);
    }

    // Determine user role (simplified)
    if (isAdmin) setUserRole('admin');
    else if (isCafeManager) setUserRole('manager');
    else if (membershipId) setUserRole('member');
    else setUserRole('guest');

  }, [
    // Consolidate dependencies
    memberData, 
    cafesData, 
    ordersData, 
    currentOrdersData, 
    sharedOrdersData, 
    allOrdersData, 
    ownedCafesData, // Add new dependency
    currentAccount?.address, 
    adminCapData, 
    managerCapData, 
    isCafeManager, // Keep dependency
    isAdmin, // Add dependency
    membershipId // Add dependency
    // managerCapId is set within this effect based on managerCapData, 
    // including it directly might cause loops if not handled carefully.
    // It's implicitly covered by managerCapData and isCafeManager dependencies.
  ]);
  
  // Create membership
  const createMembership = async () => {
    if (!currentAccount) return;
    
    try {
      const tx = new Transaction();
      
      tx.moveCall({
        target: `${COFFEE_CLUB_PACKAGE_ID}::coffee_club::create_member`,
        arguments: [tx.pure.id(COFFEE_CLUB_OBJECT_ID)],
      });
      
      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (tx) => {
            suiClient.waitForTransaction({ digest: tx.digest }).then(() => {
              refetchMembership();
            });
          },
        }
      );
    } catch (e) {
      console.error("Error creating membership:", e);
    }
  };
  
  // Order coffee
  const orderCoffee = async () => {
    if (!currentAccount || !membershipId || !selectedCafe || !selectedCoffeeType) return;
    
    try {
      const tx = new Transaction();
      
      // 1. Map the selected coffee type string to the Move helper function name
      let coffeeTypeFunctionName: string;
      switch (selectedCoffeeType) {
        case 'espresso': coffeeTypeFunctionName = 'espresso'; break;
        case 'americano': coffeeTypeFunctionName = 'americano'; break;
        case 'doppio': coffeeTypeFunctionName = 'doppio'; break;
        case 'long': coffeeTypeFunctionName = 'long'; break;
        case 'coffee': coffeeTypeFunctionName = 'coffee'; break;
        // Add cases for other coffee types if needed
        default: 
          console.error("Invalid coffee type selected:", selectedCoffeeType);
          return; // Or handle error appropriately
      }
      
      // 2. Call the Move helper function to get the CoffeeType enum value
      const [coffeeTypeEnum] = tx.moveCall({
        target: `${COFFEE_CLUB_PACKAGE_ID}::coffee_club::${coffeeTypeFunctionName}`,
        arguments: [], // Helper functions take no arguments
      });
      
      // 3. Call the main order_coffee function with the obtained enum value
      tx.moveCall({
        target: `${COFFEE_CLUB_PACKAGE_ID}::coffee_club::order_coffee`,
        arguments: [
          tx.object(membershipId),
          tx.object(selectedCafe),
          coffeeTypeEnum, // Pass the enum value obtained from the helper function
        ],
      });
      
      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (tx) => {
            suiClient.waitForTransaction({ digest: tx.digest }).then(() => {
              refetchOrders();
              setSelectedCafe(null);
              setSelectedCoffeeType(null);
            });
          },
        }
      );
    } catch (e) {
      console.error("Error ordering coffee:", e);
    }
  };
  
  // Render order status as text
  const getOrderStatusText = (status: number) => {
    switch (status) {
      case 0: return "Created";
      case 1: return "Processing";
      case 2: return "Completed";
      case 3: return "Cancelled";
      default: return "Unknown";
    }
  };

  // Add a function to refresh all data
  const refreshData = () => {
    refetchMembership();
    refetchCafes();
    refetchOrders();
    refetchCurrentOrders();
    refetchSharedOrders();
    refetchAllOrders();
    refetchOwnedCafes(); // Add refetch for owned cafes
    refetchAdminCap();
    refetchManagerCap();
  };

  // Add this function inside the App component, before the return statement
  const copyToClipboard = (text: string, event: React.MouseEvent) => {
    navigator.clipboard.writeText(text).then(() => {
      // Create and show the copied feedback element
      const target = event.currentTarget;
      const feedback = document.createElement('div');
      feedback.className = 'copied-feedback';
      feedback.textContent = 'Copied!';
      
      // Position the feedback near the clicked element
      target.appendChild(feedback);
      
      // Show the feedback
      setTimeout(() => feedback.classList.add('show'), 10);
      
      // Remove the feedback after a delay
      setTimeout(() => {
        feedback.classList.remove('show');
        setTimeout(() => feedback.remove(), 300);
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  // Add function to create a cafe manager
  const addCafeManager = async (recipientAddress: string) => {
    if (!currentAccount || !isAdmin) return;
    
    try {
      const adminCapId = adminCapData?.data?.[0]?.data?.objectId;
      if (!adminCapId) {
        console.error("Admin capability not found");
        return;
      }
      
      const tx = new Transaction();
      
      tx.moveCall({
        target: `${COFFEE_CLUB_PACKAGE_ID}::coffee_club::add_manager`,
        arguments: [
          tx.object(adminCapId),
          tx.pure.address(recipientAddress)
        ],
      });
      
      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (tx) => {
            suiClient.waitForTransaction({ digest: tx.digest }).then(() => {
              refetchManagerCap();
            });
          },
        }
      );
    } catch (e) {
      console.error("Error adding cafe manager:", e);
    }
  };
  
  // Add BCS serialization for order status
  const OrderStatus = bcs.enum('OrderStatus', {
    Created: null,
    Processing: null,
    Completed: null,
    Cancelled: null
  });
  
  // Add function to update order status using BCS
  const updateOrderStatus = async (orderId: string, cafeId: string, status: number) => {
    if (!currentAccount || !isCafeManager) return;
    
    try {
      const tx = new Transaction();
      
      // First, create the enum value by calling a helper function in your Move module
      // This assumes you have helper functions in your Move module like:
      // public fun created(): OrderStatus { OrderStatus::Created }
      // public fun processing(): OrderStatus { OrderStatus::Processing }
      // etc.
      
      let statusFunctionName;
      switch(status) {
        case 0: statusFunctionName = "created"; break;
        case 1: statusFunctionName = "processing"; break;
        case 2: statusFunctionName = "completed"; break;
        case 3: statusFunctionName = "cancelled"; break;
        default: statusFunctionName = "created";
      }
      
      // First call to get the enum value
      const [orderStatus] = tx.moveCall({
        target: `${COFFEE_CLUB_PACKAGE_ID}::coffee_club::${statusFunctionName}`,
        arguments: [],
      });
      
      // Then use that enum value in the update function
      tx.moveCall({
        target: `${COFFEE_CLUB_PACKAGE_ID}::coffee_club::update_coffee_order`,
        arguments: [
          tx.object(cafeId),
          tx.object(orderId),
          orderStatus
        ],
      });
      
      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (tx) => {
            suiClient.waitForTransaction({ digest: tx.digest }).then(() => {
              refetchOrders();
              refetchCurrentOrders();
            });
          },
        }
      );
    } catch (e) {
      console.error("Error updating order status:", e);
    }
  };
  
  // Add function to create a cafe with BCS serialized data
  const createCafe = async (name: string, location: string, description: string) => {
    if (!currentAccount || !isCafeManager || !managerCapId) return;
    
    try {
      const tx = new Transaction();
      
      // Define BCS struct for cafe data
      const CafeData = bcs.struct('CafeData', {
        name: bcs.string(),
        location: bcs.string(),
        description: bcs.string()
      });
      
      // We're not actually using the BCS serialization here since the Move call
      // expects individual arguments, but this shows how you would define it
      
      tx.moveCall({
        target: `${COFFEE_CLUB_PACKAGE_ID}::coffee_club::create_cafe`,
        arguments: [
          tx.object(managerCapId),
          tx.pure.string(name),
          tx.pure.string(location),
          tx.pure.string(description)
        ],
      });
      
      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (tx) => {
            suiClient.waitForTransaction({ digest: tx.digest }).then(() => {
              refetchCafes();
            });
          },
        }
      );
    } catch (e) {
      console.error("Error creating cafe:", e);
    }
  };

  // Add a function to directly fetch an order by ID
  const fetchOrderById = async (orderId: string) => {
    if (!orderId) return;
    
    try {
      const response = await suiClient.getObject({
        id: orderId,
        options: {
          showContent: true,
          showDisplay: true,
          showOwner: true
        }
      });
      
      console.log("Fetched order by ID:", response);
      return response;
    } catch (e) {
      console.error("Error fetching order by ID:", e);
      return null;
    }
  };

  // Add this to your useEffect to manually fetch orders from transaction history
  useEffect(() => {
    if (ordersData?.data && ordersData.data.length > 0) {
      // Look for order IDs in transaction history
      const orderIds = new Set<string>();
      
      for (const tx of ordersData.data) {
        // Check for shared objects in the transaction
        if (tx.effects?.sharedObjects) {
          for (const sharedObj of tx.effects.sharedObjects) {
            // Fetch each shared object to check if it's a coffee order
            orderIds.add(sharedObj.objectId);
          }
        }
        
        // Also check mutated objects
        if (tx.effects?.mutated) {
          for (const mutatedObj of tx.effects.mutated) {
            if (mutatedObj.owner?.Shared) {
              orderIds.add(mutatedObj.reference.objectId);
            }
          }
        }
      }
      
      // Fetch each order by ID
      console.log("Found order IDs to fetch:", Array.from(orderIds));
      for (const orderId of orderIds) {
        fetchOrderById(orderId);
      }
    }
  }, [ordersData]);

  return (
    <div className="container">
      <header className="header">
        <h1>Coffee Club Portal</h1>
        <div className="connect-button">
          <ConnectButton />
        </div>
      </header>
      
      <main className="main-content">
        {!currentAccount ? (
          <div className="card">
            <div className="card-content">
              <h2>Welcome to Coffee Club</h2>
              <p>Please connect your wallet to continue</p>
            </div>
          </div>
        ) : (adminCapLoading || managerCapLoading || memberLoading) ? (
          <div className="card">
            <div className="card-content">
              <h2>Loading...</h2>
              <p>Please wait while we check your account</p>
            </div>
          </div>
        ) : (
          <div className="role-tabs-container">
            <div className="role-tabs-header">
              {userRole === 'guest' && (
                <button 
                  className="tab-button active"
                  onClick={() => {}}
                >
                  Join Coffee Club
                </button>
              )}
              
              {userRole !== 'guest' && (
                <button 
                  className={`tab-button ${userRole === 'member' && activeTab === 'order' ? 'active' : ''}`}
                  onClick={() => {setActiveTab('order'); setUserRole('member');}}
                >
                  Member
                </button>
              )}
              
              {isCafeManager && (
                <button 
                  className={`tab-button ${userRole === 'manager' ? 'active' : ''}`}
                  onClick={() => {setActiveTab('manage-cafe'); setUserRole('manager');}}
                >
                  Cafe Manager
                </button>
              )}
              
              {isAdmin && (
                <button 
                  className={`tab-button ${userRole === 'admin' ? 'active' : ''}`}
                  onClick={() => {setActiveTab('admin'); setUserRole('admin');}}
                >
                  Admin
                </button>
              )}
            </div>
            
            <div className="tab-content">
              {userRole === 'guest' && (
                <div className="card">
                  <div className="card-content">
                    <h2>Become a Coffee Club Member</h2>
                    <p>Join our coffee club to order coffee from our partner cafes</p>
                    <button 
                      className="button primary" 
                      onClick={createMembership}
                    >
                      Create Membership
                    </button>
                  </div>
                </div>
              )}
              
              {userRole === 'member' && (
                <div className="tabs-container">
                  <div className="tabs-header">
                    <button 
                      className={`tab-button ${activeTab === 'order' ? 'active' : ''}`}
                      onClick={() => setActiveTab('order')}
                    >
                      Order Coffee
                    </button>
                    <button 
                      className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
                      onClick={() => setActiveTab('history')}
                    >
                      Order History
                    </button>
                  </div>
                  
                  <div className="tab-content">
                    {activeTab === 'order' && (
                      <div className="card">
                        <div className="card-content">
                          <h2>Order Coffee</h2>
                          
                          {cafesLoading ? (
                            <p>Loading cafes...</p>
                          ) : cafeList.length === 0 ? (
                            <p>No cafes available at the moment</p>
                          ) : (
                            <>
                              <div className="cafe-selection">
                                {cafeList.map((cafe) => (
                                  <div
                                    key={cafe.objectId}
                                    className={`cafe-card ${selectedCafe === cafe.objectId ? 'selected' : ''}`}
                                    onClick={() => {
                                      setSelectedCafe(cafe.objectId);
                                      setSelectedCoffeeType(null); // Reset coffee selection when cafe changes
                                    }}
                                  >
                                    <div className="cafe-card-header">
                                      <div className="cafe-icon">
                                        {cafe.fields?.name?.[0] || '☕'}
                                      </div>
                                      <div>
                                        <h3 className="cafe-name">{cafe.fields?.name || "Unknown Cafe"}</h3>
                                        <div className="cafe-location">
                                          {cafe.fields?.location || "Location not specified"}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="cafe-description">
                                      {cafe.fields?.description || "No description available"}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              
                              {selectedCafe && (
                                <div className="coffee-selection">
                                  <h3>Select Your Coffee</h3>
                                  <div className="coffee-grid">
                                    {COFFEE_TYPES.map((coffee) => (
                                      <div
                                        key={coffee.id}
                                        className={`coffee-option ${selectedCoffeeType === coffee.id ? 'selected' : ''}`}
                                        onClick={() => setSelectedCoffeeType(coffee.id)}
                                      >
                                        <div className="coffee-icon">{coffee.icon}</div>
                                        <h4 className="coffee-name">{coffee.name}</h4>
                                        <div className="coffee-description">{coffee.description}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              <div className="order-button-container">
                                <button
                                  className="order-button"
                                  disabled={!selectedCafe || !selectedCoffeeType}
                                  onClick={orderCoffee}
                                >
                                  Place Order
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {activeTab === 'history' && (
                      <div className="card">
                        <div className="card-content">
                          <div className="header-with-button">
                            <h2>Order History</h2>
                            <button 
                              className="button secondary small" 
                              onClick={refreshData}
                            >
                              Refresh
                            </button>
                          </div>
                          
                          {ordersLoading || currentOrdersLoading ? (
                            <p>Loading orders...</p>
                          ) : orders.length === 0 ? (
                            <p>No orders found</p>
                          ) : (
                            <div className="order-list">
                              {orders.map((order) => {
                                const status = order.fields?.status || 0;
                                const statusText = getOrderStatusText(status);
                                const timestamp = order.fields?.timestamp ? 
                                  new Date(parseInt(order.fields.timestamp)).toLocaleString() : 'Unknown date';
                                const statusLastUpdated = order.fields?.statusLastUpdated ? 
                                  new Date(parseInt(order.fields.statusLastUpdated)).toLocaleString() : 'Unknown';
                                const cafe = cafeList.find(c => c.objectId === order.fields?.cafe)?.fields?.name || 
                                            (order.fields?.cafe ? order.fields.cafe.substring(0, 8) + "..." : 'Unknown cafe');
                                
                                return (
                                  <div className={`order-item status-${status}`} key={order.objectId || order.txDigest}>
                                    <div className="order-header">
                                      <div className="order-title">
                                        <span className="cafe-name">{cafe}</span>
                                        <span className={`order-status status-${status}`}>{statusText}</span>
                                      </div>
                                      <div className="order-date">{timestamp}</div>
                                    </div>
                                    <div className="order-body">
                                      <div className="order-details">
                                        <div className="detail-row">
                                          <span className="detail-label">Order ID:</span>
                                          <span 
                                            className="detail-value copyable" 
                                            onClick={(e) => copyToClipboard(order.objectId || "", e)}
                                            title="Click to copy order ID"
                                          >
                                            {(order.objectId || "").substring(0, 16)}...
                                          </span>
                                        </div>
                                        <div className="detail-row">
                                          <span className="detail-label">Status Last Updated:</span>
                                          <span className="detail-value">{statusLastUpdated}</span>
                                        </div>
                                        
                                        <div className="order-actions">
                                          <button 
                                            className="button small"
                                            disabled={status === 1}
                                            onClick={() => updateOrderStatus(order.objectId, order.fields?.cafe, 1)}
                                          >
                                            Mark Processing
                                          </button>
                                          <button 
                                            className="button small"
                                            disabled={status === 2}
                                            onClick={() => updateOrderStatus(order.objectId, order.fields?.cafe, 2)}
                                          >
                                            Mark Completed
                                          </button>
                                          <button 
                                            className="button small danger"
                                            disabled={status === 3}
                                            onClick={() => updateOrderStatus(order.objectId, order.fields?.cafe, 3)}
                                          >
                                            Cancel Order
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {userRole === 'manager' && (
                <div className="tabs-container">
                  <div className="tabs-header">
                    <button 
                      className={`tab-button ${activeTab === 'manage-cafe' ? 'active' : ''}`}
                      onClick={() => setActiveTab('manage-cafe')}
                    >
                      Manage Cafe
                    </button>
                    <button 
                      className={`tab-button ${activeTab === 'manage-orders' ? 'active' : ''}`}
                      onClick={() => setActiveTab('manage-orders')}
                    >
                      Manage Orders
                    </button>
                  </div>
                  
                  <div className="tab-content">
                    {activeTab === 'manage-cafe' && (
                      <div className="card">
                        <div className="card-content">
                          <h2>Manage Your Cafes</h2>

                          {/* Display Existing Managed Cafes */}
                          <div className="managed-cafes-section">
                            <h3>Your Cafes</h3>
                            {ownedCafesLoading ? (
                              <p>Loading your cafes...</p>
                            ) : managedCafeList.length === 0 ? (
                              <p>You haven't created any cafes yet.</p>
                            ) : (
                              <div className="managed-cafe-list">
                                {managedCafeList.map((cafe) => {
                                  const fields = cafe.data?.content?.fields;
                                  return (
                                    <div className="managed-cafe-item" key={cafe.data?.objectId}>
                                      <h4 className="cafe-name">{fields?.name || 'Unnamed Cafe'}</h4>
                                      <p className="cafe-detail">Location: {fields?.location || 'N/A'}</p>
                                      <p className="cafe-detail">Description: {fields?.description || 'N/A'}</p>
                                      {/* Add more details or actions like 'Edit' or 'Set Status' here later */}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Form to create a new cafe */}
                          <div className="form-group create-cafe-section">
                            <h3>Create New Cafe</h3>
                            <input 
                              type="text" 
                              placeholder="Cafe Name" 
                              className="input" 
                              id="cafe-name"
                            />
                            <input 
                              type="text" 
                              placeholder="Location" 
                              className="input" 
                              id="cafe-location"
                            />
                            <textarea 
                              placeholder="Description" 
                              className="textarea" 
                              id="cafe-description"
                            ></textarea>
                            <button 
                              className="button primary"
                              onClick={() => {
                                const name = (document.getElementById('cafe-name') as HTMLInputElement).value;
                                const location = (document.getElementById('cafe-location') as HTMLInputElement).value;
                                const description = (document.getElementById('cafe-description') as HTMLTextAreaElement).value;
                                createCafe(name, location, description);
                              }}
                            >
                              Create Cafe
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {activeTab === 'manage-orders' && (
                      <div className="card">
                        <div className="card-content">
                          <div className="header-with-button">
                            <h2>Manage Orders</h2>
                            <button 
                              className="button secondary small" 
                              onClick={refreshData}
                            >
                              Refresh
                            </button>
                          </div>
                          
                          {ordersLoading || currentOrdersLoading ? (
                            <p>Loading orders...</p>
                          ) : orders.length === 0 ? (
                            <p>No orders found</p>
                          ) : (
                            <div className="order-list">
                              {orders.map((order) => {
                                const status = order.fields?.status || 0;
                                const statusText = getOrderStatusText(status);
                                const timestamp = order.fields?.timestamp ? 
                                  new Date(parseInt(order.fields.timestamp)).toLocaleString() : 'Unknown date';
                                const statusLastUpdated = order.fields?.statusLastUpdated ? 
                                  new Date(parseInt(order.fields.statusLastUpdated)).toLocaleString() : 'Unknown';
                                const cafe = cafeList.find(c => c.objectId === order.fields?.cafe)?.fields?.name || 
                                            (order.fields?.cafe ? order.fields.cafe.substring(0, 8) + "..." : 'Unknown cafe');
                                
                                return (
                                  <div className={`order-item status-${status}`} key={order.objectId || order.txDigest}>
                                    <div className="order-header">
                                      <div className="order-title">
                                        <span className="cafe-name">{cafe}</span>
                                        <span className={`order-status status-${status}`}>{statusText}</span>
                                      </div>
                                      <div className="order-date">{timestamp}</div>
                                    </div>
                                    <div className="order-body">
                                      <div className="order-details">
                                        <div className="detail-row">
                                          <span className="detail-label">Order ID:</span>
                                          <span 
                                            className="detail-value copyable" 
                                            onClick={(e) => copyToClipboard(order.objectId || "", e)}
                                            title="Click to copy order ID"
                                          >
                                            {(order.objectId || "").substring(0, 16)}...
                                          </span>
                                        </div>
                                        <div className="detail-row">
                                          <span className="detail-label">Status Last Updated:</span>
                                          <span className="detail-value">{statusLastUpdated}</span>
                                        </div>
                                        
                                        <div className="order-actions">
                                          <button 
                                            className="button small"
                                            disabled={status === 1}
                                            onClick={() => updateOrderStatus(order.objectId, order.fields?.cafe, 1)}
                                          >
                                            Mark Processing
                                          </button>
                                          <button 
                                            className="button small"
                                            disabled={status === 2}
                                            onClick={() => updateOrderStatus(order.objectId, order.fields?.cafe, 2)}
                                          >
                                            Mark Completed
                                          </button>
                                          <button 
                                            className="button small danger"
                                            disabled={status === 3}
                                            onClick={() => updateOrderStatus(order.objectId, order.fields?.cafe, 3)}
                                          >
                                            Cancel Order
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {userRole === 'admin' && (
                <div className="card">
                  <div className="card-content">
                    <h2>Coffee Club Administration</h2>
                    
                    <div className="form-group">
                      <h3>Add Cafe Manager</h3>
                      <input 
                        type="text" 
                        placeholder="Manager Address" 
                        className="input" 
                        id="manager-address"
                      />
                      <button 
                        className="button primary"
                        onClick={() => {
                          const address = (document.getElementById('manager-address') as HTMLInputElement).value;
                          addCafeManager(address);
                        }}
                      >
                        Add Manager
                      </button>
                    </div>
                    
                    <div className="form-group">
                      <h3>System Overview</h3>
                      <div className="stats-container">
                        <div className="stat-item">
                          <span className="stat-label">Total Cafes:</span>
                          <span className="stat-value">{cafeList.length}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Total Orders:</span>
                          <span className="stat-value">{orders.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;