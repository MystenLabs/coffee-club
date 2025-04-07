import { useState, useEffect } from 'react'
import { ConnectButton, useCurrentAccount, useSignAndExecuteTransaction, useSuiClient, useSuiClientQuery } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import './App.css'
import { COFFEE_CLUB_PACKAGE_ID, COFFEE_CLUB_OBJECT_ID } from './constants'

// Add this constant for the cafe
const COFFEE_CLUB_CAFE_ID = COFFEE_CLUB_OBJECT_ID; // Using the same ID as the club for now

function App() {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [membershipId, setMembershipId] = useState<string | null>(null);
  const [cafeList, setCafeList] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedCafe, setSelectedCafe] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('order');
  
  // Add states for role-based access
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCafeManager, setIsCafeManager] = useState(false);
  const [managerCapId, setManagerCapId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'guest' | 'member' | 'manager' | 'admin'>('guest');
  
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
  
  // Fetch cafes
  const { data: cafesData, isPending: cafesLoading, refetch: refetchCafes } = 
    useSuiClientQuery("getObject", {
      id: COFFEE_CLUB_CAFE_ID,
      options: {
        showContent: true
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
  
  // Add a query to fetch current order objects
  const { data: currentOrdersData, isPending: currentOrdersLoading, refetch: refetchCurrentOrders } = 
    useSuiClientQuery("getEvents", {
      query: {
        MoveEventType: `${COFFEE_CLUB_PACKAGE_ID}::coffee_club::CoffeeOrder`
      },
      limit: 50,
    },
    { enabled: !!currentAccount?.address }
  );
  
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
  
  // Update state when data is loaded
  useEffect(() => {
    if (memberData?.data && memberData.data.length > 0) {
      const membershipObject = memberData.data[0];
      console.log("Membership object:", JSON.stringify(membershipObject, null, 2));
      console.log("Object ID:", membershipObject.data?.objectId);
      setMembershipId(membershipObject.data?.objectId);
    } else if (memberData?.data) {
      console.log("No membership found in data:", memberData);
      setMembershipId(null);
    }
    
    if (cafesData) {
      console.log("Cafe data:", JSON.stringify(cafesData, null, 2));
      // Create a cafe object from the fetched data
      const coffeeClubCafe = {
        objectId: COFFEE_CLUB_CAFE_ID,
        content: {
          fields: {
            name: cafesData.data?.content?.fields?.name || "Coffee Club HQ"
          }
        }
      };
      
      setCafeList([coffeeClubCafe]);
    }
    
    if (ordersData?.data) {
      console.log("Orders data:", JSON.stringify(ordersData, null, 2));
      
      // Process transaction data to extract coffee orders
      const processedOrders = [];
      
      for (const tx of ordersData.data) {
        // Check if this transaction is a coffee order by examining the transaction
        if (tx.transaction?.data?.transaction?.transactions) {
          const moveCall = tx.transaction.data.transaction.transactions.find(t => 
            t.MoveCall && 
            t.MoveCall.package === COFFEE_CLUB_PACKAGE_ID && 
            t.MoveCall.module === "coffee_club" && 
            t.MoveCall.function === "order_coffee"
          );
          
          if (moveCall) {
            // Extract created objects from effects to find the order
            const createdOrder = tx.effects?.created?.find(obj => 
              obj.reference && obj.owner && obj.owner.Shared
            );
            
            if (createdOrder) {
              processedOrders.push({
                objectId: createdOrder.reference.objectId,
                content: {
                  fields: {
                    status: 0, // Default to "Created" status
                    timestamp: tx.timestampMs,
                    cafe: tx.transaction.data.transaction.inputs?.[1]?.value
                  }
                },
                txDigest: tx.digest
              });
            }
          }
        }
      }
      
      // Add data from events if available
      if (currentOrdersData?.data) {
        for (const event of currentOrdersData.data) {
          if (event.parsedJson && 
              event.parsedJson.member && 
              event.parsedJson.member === currentAccount?.address) {
            
            // Check if this order is already in our list
            const existingOrderIndex = processedOrders.findIndex(o => o.objectId === event.parsedJson.id);
            
            if (existingOrderIndex >= 0) {
              // Update existing order with more details
              processedOrders[existingOrderIndex].content.fields.status = event.parsedJson.status || 0;
            } else {
              // Add as new order
              processedOrders.push({
                objectId: event.parsedJson.id,
                content: {
                  fields: {
                    status: event.parsedJson.status || 0,
                    timestamp: event.timestampMs,
                    cafe: event.parsedJson.cafe_id
                  }
                },
                txDigest: event.id.txDigest
              });
            }
          }
        }
      }
      
      // Sort orders by timestamp, newest first
      processedOrders.sort((a, b) => 
        (parseInt(b.content.fields.timestamp) || 0) - (parseInt(a.content.fields.timestamp) || 0)
      );
      
      setOrders(processedOrders);
    }
  }, [memberData, cafesData, ordersData, currentOrdersData, currentAccount?.address]);
  
  // Update useEffect to check for roles
  useEffect(() => {
    // Check for admin capability
    if (adminCapData?.data && adminCapData.data.length > 0) {
      console.log("Admin capability found:", adminCapData.data[0]);
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
    
    // Check for manager capability
    if (managerCapData?.data && managerCapData.data.length > 0) {
      console.log("Manager capability found:", managerCapData.data[0]);
      setIsCafeManager(true);
      setManagerCapId(managerCapData.data[0].data?.objectId);
    } else {
      setIsCafeManager(false);
      setManagerCapId(null);
    }
    
    // Determine user role
    if (isAdmin) {
      setUserRole('admin');
    } else if (isCafeManager) {
      setUserRole('manager');
    } else if (membershipId) {
      setUserRole('member');
    } else {
      setUserRole('guest');
    }
    
  }, [adminCapData, managerCapData, membershipId]);
  
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
    if (!currentAccount || !membershipId || !selectedCafe) return;
    
    try {
      const tx = new Transaction();
      
      tx.moveCall({
        target: `${COFFEE_CLUB_PACKAGE_ID}::coffee_club::order_coffee`,
        arguments: [
          tx.object(membershipId),
          tx.object(selectedCafe)
        ],
      });
      
      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (tx) => {
            suiClient.waitForTransaction({ digest: tx.digest }).then(() => {
              refetchOrders();
              setSelectedCafe(null);
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
  
  // Add function to create a cafe
  const createCafe = async (name: string, location: string, description: string) => {
    if (!currentAccount || !isCafeManager || !managerCapId) return;
    
    try {
      const tx = new Transaction();
      
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
  
  // Add function to update order status
  const updateOrderStatus = async (orderId: string, cafeId: string, status: number) => {
    if (!currentAccount || !isCafeManager) return;
    
    try {
      const tx = new Transaction();
      
      tx.moveCall({
        target: `${COFFEE_CLUB_PACKAGE_ID}::coffee_club::update_coffee_order`,
        arguments: [
          tx.object(cafeId),
          tx.object(orderId),
          tx.pure.u8(status)
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
                            <div className="form-group">
                              <label htmlFor="cafe-select">Select a cafe:</label>
                              <select 
                                id="cafe-select"
                                value={selectedCafe || ""}
                                onChange={(e) => setSelectedCafe(e.target.value)}
                                className="select"
                              >
                                <option value="">-- Select a cafe --</option>
                                {cafeList.map((cafe) => (
                                  <option 
                                    key={cafe.objectId} 
                                    value={cafe.objectId}
                                  >
                                    {cafe.content?.fields?.name || "Unknown Cafe"}
                                  </option>
                                ))}
                              </select>
                              
                              <button 
                                className="button primary"
                                disabled={!selectedCafe} 
                                onClick={orderCoffee}
                              >
                                Place Order
                              </button>
                            </div>
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
                                const status = order.content?.fields?.status || 0;
                                const statusText = getOrderStatusText(status);
                                const timestamp = order.content?.fields?.timestamp ? 
                                  new Date(parseInt(order.content.fields.timestamp)).toLocaleString() : 'Unknown date';
                                const cafe = cafeList.find(c => c.objectId === order.content?.fields?.cafe)?.content?.fields?.name || 
                                            (order.content?.fields?.cafe ? order.content.fields.cafe.substring(0, 8) + "..." : 'Unknown cafe');
                                
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
                                        
                                        <div className="order-actions">
                                          <button 
                                            className="button small"
                                            disabled={status === 1}
                                            onClick={() => updateOrderStatus(order.objectId, order.content?.fields?.cafe, 1)}
                                          >
                                            Mark Processing
                                          </button>
                                          <button 
                                            className="button small"
                                            disabled={status === 2}
                                            onClick={() => updateOrderStatus(order.objectId, order.content?.fields?.cafe, 2)}
                                          >
                                            Mark Completed
                                          </button>
                                          <button 
                                            className="button small danger"
                                            disabled={status === 3}
                                            onClick={() => updateOrderStatus(order.objectId, order.content?.fields?.cafe, 3)}
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
                          <h2>Manage Your Cafe</h2>
                          
                          {/* Form to create a new cafe */}
                          <div className="form-group">
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
                                const status = order.content?.fields?.status || 0;
                                const statusText = getOrderStatusText(status);
                                const timestamp = order.content?.fields?.timestamp ? 
                                  new Date(parseInt(order.content.fields.timestamp)).toLocaleString() : 'Unknown date';
                                const cafe = cafeList.find(c => c.objectId === order.content?.fields?.cafe)?.content?.fields?.name || 
                                            (order.content?.fields?.cafe ? order.content.fields.cafe.substring(0, 8) + "..." : 'Unknown cafe');
                                
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
                                        
                                        <div className="order-actions">
                                          <button 
                                            className="button small"
                                            disabled={status === 1}
                                            onClick={() => updateOrderStatus(order.objectId, order.content?.fields?.cafe, 1)}
                                          >
                                            Mark Processing
                                          </button>
                                          <button 
                                            className="button small"
                                            disabled={status === 2}
                                            onClick={() => updateOrderStatus(order.objectId, order.content?.fields?.cafe, 2)}
                                          >
                                            Mark Completed
                                          </button>
                                          <button 
                                            className="button small danger"
                                            disabled={status === 3}
                                            onClick={() => updateOrderStatus(order.objectId, order.content?.fields?.cafe, 3)}
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
  )
}

export default App
