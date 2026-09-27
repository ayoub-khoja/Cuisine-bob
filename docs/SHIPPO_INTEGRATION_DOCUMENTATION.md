# Shippo Integration Documentation

**Complete Reference Guide for Shippo Shipping Label Generation & Tracking Management**

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Components](#components)
4. [Hooks](#hooks)
5. [Services](#services)
6. [API Endpoints](#api-endpoints)
7. [Data Schemas](#data-schemas)
8. [Configuration](#configuration)
9. [Error Handling](#error-handling)
10. [Test Mode vs Production](#test-mode-vs-production)
11. [Pros & Cons](#pros--cons)
12. [Implementation Examples](#implementation-examples)
13. [Best Practices](#best-practices)
14. [Troubleshooting](#troubleshooting)

---

## Overview

### What is Shippo?

Shippo is a shipping API that allows you to:

- Generate shipping labels for multiple carriers (USPS, UPS, FedEx, DHL)
- Get real-time shipping rates
- Track packages
- Validate addresses
- Print shipping labels (PDF)

### Integration Type

**Hybrid Approach**:

- **Primary**: Shippo API integration for automatic label generation
- **Fallback**: Manual tracking number entry for flexibility

### Key Features

✅ Automatic shipping label generation via Shippo API  
✅ Manual tracking number entry (fallback)  
✅ Order status automation (auto-set to "shipped")  
✅ Tracking info display on customer dashboard  
✅ Email notifications with tracking details  
✅ Support for multiple carriers (USPS, UPS, FedEx, DHL)  
✅ Test mode support (no charges, test tracking numbers)

---

## Architecture

### System Flow

```
Admin Panel (AdminOrderDetailPage)
    ↓
React Hook (useGenerateShippingLabel / useAddTrackingNumber)
    ↓
Frontend Service (adminService.js)
    ↓
AWS Lambda Function (generate-label.js / add-tracking.js)
    ↓
Shippo API (for label generation) OR DynamoDB (for manual entry)
    ↓
DynamoDB (update order with tracking info)
    ↓
Email Service (send shipping notification)
    ↓
Customer Dashboard (OrderTrackingInfo component)
```

### File Structure

```bash
codebook/
├── aws-lambda/
│   ├── functions/
│   │   └── admin/
│   │       ├── generate-label.js      # Shippo API integration
│   │       └── add-tracking.js        # Manual tracking entry
│   └── shared/
│       └── orders.js                  # updateOrderTracking function
├── src/
│   ├── components/
│   │   └── ui/
│   │       └── order-tracking-info.js # Display component
│   ├── hooks/
│   │   └── useAdmin.js                # React Query hooks
│   ├── services/
│   │   ├── adminService.js            # API service functions
│   │   └── emailService.js            # Email notifications
│   └── pages/
│       └── Admin/
│           └── AdminOrderDetailPage.js # Admin UI
```

---

## Components

### OrderTrackingInfo

**Location**: `codebook/src/components/ui/order-tracking-info.js`

**Purpose**: Displays shipping tracking information on customer dashboard

**Props**:

```typescript
{
  order: {
    status: string;              // "shipped" | "delivered" | "cancelled" | "refunded"
    trackingNumber?: string;     // Tracking number
    trackingCarrier?: string;    // "usps" | "ups" | "fedex" | "dhl" | "other"
    trackingUrl?: string;       // Optional: custom tracking URL
    labelUrl?: string;          // Optional: Shippo label PDF URL
    paymentStatus?: string;      // Optional: "refunded" (hides tracking if refunded)
  };
  className?: string;           // Optional: additional CSS classes
}
```

**Features**:

- ✅ Only displays for `shipped` or `delivered` orders
- ✅ Hides for `cancelled` or `refunded` orders
- ✅ Auto-generates tracking URLs for major carriers
- ✅ Shows carrier badge with StatusBadge component
- ✅ Displays label PDF download link (if available)
- ✅ Responsive design with dark mode support

**Usage**:

```jsx
import { OrderTrackingInfo } from "../../../components/ui";

<OrderTrackingInfo order={order} />;
```

**Display Logic**:

```javascript
// Only shows if:
const hasTrackingInfo =
  (order.status === "shipped" || order.status === "delivered") &&
  order.trackingNumber &&
  !(
    order.status === "cancelled" ||
    order.status === "refunded" ||
    order.paymentStatus === "refunded"
  );
```

**Auto-Generated Tracking URLs**:

- **USPS**: `https://tools.usps.com/go/TrackConfirmAction_input?origTrackNum={trackingNumber}`
- **UPS**: `https://www.ups.com/track?tracknum={trackingNumber}`
- **FedEx**: `https://www.fedex.com/fedextrack/?trknbr={trackingNumber}`
- **DHL**: `https://www.dhl.com/en/express/tracking.html?AWB={trackingNumber}`

---

## Hooks

### useGenerateShippingLabel

**Location**: `codebook/src/hooks/useAdmin.js`

**Purpose**: React Query mutation hook for generating shipping labels via Shippo API

**Returns**: `useMutation` result with:

- `mutate`: Function to trigger label generation
- `mutateAsync`: Async function (returns promise)
- `isPending`: Loading state
- `isError`: Error state
- `isSuccess`: Success state
- `data`: Response data
- `error`: Error object

**Usage**:

```javascript
import { useGenerateShippingLabel } from "../../hooks/useAdmin";

const generateLabelMutation = useGenerateShippingLabel();

// Trigger label generation
generateLabelMutation.mutate({
  orderId: "order-123",
  options: {
    carrier: "usps",
    service: "priority",
    // Optional: override addresses
    fromAddress: { ... },
    toAddress: { ... },
  }
});

// Or with async/await
try {
  const result = await generateLabelMutation.mutateAsync({
    orderId: "order-123",
    options: {}
  });
  console.log("Label generated:", result);
} catch (error) {
  console.error("Failed:", error);
}
```

**Automatic Actions on Success**:

1. Invalidates order queries (refetches data)
2. Shows success toast with tracking number
3. Sends shipping notification email to customer
4. Logs success data to console

**Automatic Actions on Error**:

1. Shows error toast with message
2. Logs error to console

---

### useAddTrackingNumber

**Location**: `codebook/src/hooks/useAdmin.js`

**Purpose**: React Query mutation hook for adding manual tracking numbers

**Returns**: `useMutation` result (same structure as `useGenerateShippingLabel`)

**Usage**:

```javascript
import { useAddTrackingNumber } from "../../hooks/useAdmin";

const addTrackingMutation = useAddTrackingNumber();

// Add tracking number
addTrackingMutation.mutate({
  orderId: "order-123",
  trackingNumber: "9400111899223197428490",
  trackingCarrier: "usps", // Optional, default: "usps"
  status: "shipped", // Optional, default: "shipped"
});
```

**Automatic Actions on Success**:

1. Invalidates order queries
2. Shows success toast
3. Sends shipping notification email
4. Updates order status to "shipped"

---

## Services

### generateShippingLabel

**Location**: `codebook/src/services/adminService.js`

**Purpose**: Frontend service function to call Lambda API for label generation

**Signature**:

```javascript
async function generateShippingLabel(orderId, options = {})
```

**Parameters**:

- `orderId` (string, required): Order ID (UUID)
- `options` (object, optional): Label generation options

  ```javascript
  {
    carrier?: string;        // "usps" | "ups" | "fedex" | "dhl" (default: "usps")
    service?: string;        // Service level token (default: first available)
    fromAddress?: object;   // Override sender address
    toAddress?: object;      // Override recipient address
    length?: string;         // Parcel length in inches (default: "10")
    width?: string;          // Parcel width in inches (default: "8")
    height?: string;         // Parcel height in inches (default: "4")
  }
  ```

**Returns**: Promise resolving to:

```javascript
{
  orderId: string;
  trackingNumber: string;      // May be "TEST-XXXXXXXXXXXX" in test mode
  trackingCarrier: string;     // "usps" | "ups" | "fedex" | "dhl"
  labelUrl?: string;            // Shippo label PDF URL (if available)
  trackingUrl?: string;         // Carrier tracking URL (if available)
  status: string;               // "shipped"
  updatedAt: string;            // ISO timestamp
  user?: {                      // Customer info (for email)
    id: string;
    email: string;
    name: string;
  };
}
```

**Throws**: `ApiError` with message and status code

**Example**:

```javascript
import { generateShippingLabel } from "../services/adminService";

try {
  const result = await generateShippingLabel("order-123", {
    carrier: "usps",
    service: "priority",
  });
  console.log("Tracking:", result.trackingNumber);
} catch (error) {
  console.error("Error:", error.message);
}
```

---

### addTrackingNumber

**Location**: `codebook/src/services/adminService.js`

**Purpose**: Frontend service function to call Lambda API for manual tracking entry

**Signature**:

```javascript
async function addTrackingNumber(orderId, trackingNumber, trackingCarrier = "usps", status = "shipped")
```

**Parameters**:

- `orderId` (string, required): Order ID
- `trackingNumber` (string, required): Tracking number
- `trackingCarrier` (string, optional): Carrier name (default: "usps")
- `status` (string, optional): Order status (default: "shipped")

**Returns**: Promise resolving to same structure as `generateShippingLabel`

**Example**:

```javascript
import { addTrackingNumber } from "../services/adminService";

await addTrackingNumber(
  "order-123",
  "9400111899223197428490",
  "usps",
  "shipped",
);
```

---

### sendShippingNotificationEmail

**Location**: `codebook/src/services/emailService.js`

**Purpose**: Send shipping notification email to customer

**Signature**:

```javascript
async function sendShippingNotificationEmail(shippingData)
```

**Parameters**:

```javascript
{
  customerEmail: string;        // Required: customer email
  customerName?: string;        // Optional: customer name
  orderId: string;              // Required: order ID
  trackingNumber?: string;       // Optional: tracking number
  trackingCarrier?: string;       // Optional: carrier name
  trackingUrl?: string;          // Optional: tracking URL
}
```

**Returns**: Promise resolving to email send result

**Example**:

```javascript
import { sendShippingNotificationEmail } from "../services/emailService";

await sendShippingNotificationEmail({
  customerEmail: "customer@example.com",
  customerName: "John Doe",
  orderId: "order-123",
  trackingNumber: "9400111899223197428490",
  trackingCarrier: "usps",
  trackingUrl:
    "https://tools.usps.com/go/TrackConfirmAction_input?origTrackNum=9400111899223197428490",
});
```

---

## API Endpoints

### POST /admin/orders/{id}/generate-label

**Purpose**: Generate shipping label via Shippo API

**Authentication**: Required (Bearer token)
**Authorization**: Admin role required

**Request Body** (optional):

```json
{
  "carrier": "usps",
  "service": "priority",
  "fromAddress": {
    "name": "CodeBook Store",
    "street1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "country": "US",
    "phone": "+1 555 123 4567",
    "email": "store@example.com"
  },
  "toAddress": {
    "name": "John Doe",
    "street1": "456 Oak Ave",
    "city": "San Francisco",
    "state": "CA",
    "zip": "94102",
    "country": "US",
    "phone": "+1 555 987 6543",
    "email": "customer@example.com"
  },
  "length": "10",
  "width": "8",
  "height": "4"
}
```

**Response** (200 OK):

```json
{
  "orderId": "order-123",
  "trackingNumber": "9400111899223197428490",
  "trackingCarrier": "usps",
  "labelUrl": "https://shippo-delivery.s3.amazonaws.com/...",
  "trackingUrl": "https://tools.usps.com/go/TrackConfirmAction_input?origTrackNum=9400111899223197428490",
  "status": "shipped",
  "updatedAt": "2025-12-06T12:00:00.000Z",
  "user": {
    "id": "user-123",
    "email": "customer@example.com",
    "name": "John Doe"
  }
}
```

**Error Responses**:

- `400 Bad Request`: Invalid request body, incomplete address
- `403 Forbidden`: Admin access required
- `404 Not Found`: Order not found
- `500 Internal Server Error`: Shippo API error, server error
- `503 Service Unavailable`: Shippo service temporarily unavailable

---

### POST /admin/orders/{id}/tracking

**Purpose**: Add manual tracking number

**Authentication**: Required (Bearer token)
**Authorization**: Admin role required

**Request Body**:

```json
{
  "trackingNumber": "9400111899223197428490",
  "trackingCarrier": "usps",
  "status": "shipped"
}
```

**Response** (200 OK):

```json
{
  "orderId": "order-123",
  "trackingNumber": "9400111899223197428490",
  "trackingCarrier": "usps",
  "status": "shipped",
  "updatedAt": "2025-12-06T12:00:00.000Z",
  "user": {
    "id": "user-123",
    "email": "customer@example.com",
    "name": "John Doe"
  }
}
```

**Error Responses**:

- `400 Bad Request`: Missing tracking number, invalid JSON
- `403 Forbidden`: Admin access required
- `404 Not Found`: Order not found
- `500 Internal Server Error`: Database error

---

## Data Schemas

### Order Object (with Tracking)

```typescript
interface Order {
  id: string; // UUID
  userId: string; // User ID
  user?: {
    // User object (populated)
    id: string;
    email: string;
    name: string;
  };
  cartList: Array<{
    // Order items
    id: string;
    name: string;
    quantity: number;
    price: number;
    // ... other product fields
  }>;
  amount_paid: number; // Amount in cents
  status: string; // "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded"
  paymentStatus?: string; // "paid" | "refunded" | "failed"

  // Tracking fields (added by Shippo integration)
  trackingNumber?: string; // Tracking number (from Shippo or manual)
  trackingCarrier?: string; // "usps" | "ups" | "fedex" | "dhl" | "other"
  trackingUrl?: string; // Carrier tracking URL
  labelUrl?: string; // Shippo label PDF URL

  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}
```

### Shippo Address Object

```typescript
interface ShippoAddress {
  name: string; // Required
  street1: string; // Required
  street2?: string; // Optional
  city: string; // Required
  state: string; // Required (2-letter code)
  zip: string; // Required (5 or 9 digits)
  country: string; // Required (2-letter code, default: "US")
  phone: string; // Required for USPS
  email: string; // Required for USPS
}
```

### Shippo Parcel Object

```typescript
interface ShippoParcel {
  length: string; // Inches (default: "10")
  width: string; // Inches (default: "8")
  height: string; // Inches (default: "4")
  distance_unit: "in"; // Always "in" for inches
  weight: string; // Pounds (calculated from order items)
  mass_unit: "lb"; // Always "lb" for pounds
}
```

### Shippo Shipment Object

```typescript
interface ShippoShipment {
  address_from: ShippoAddress;
  address_to: ShippoAddress;
  parcels: ShippoParcel[];
  async: boolean; // false = synchronous (wait for rates)
}
```

### Shippo Rate Object

```typescript
interface ShippoRate {
  object_id: string; // Rate ID (used to purchase label)
  carrier: string; // "usps" | "ups" | "fedex" | "dhl"
  servicelevel: {
    name: string; // "Priority Mail" | "Ground" | etc.
    token: string; // Service token
    carrier: string; // Carrier code
  };
  amount: string; // Price (e.g., "5.50")
  currency: string; // "USD"
}
```

### Shippo Transaction Object

```typescript
interface ShippoTransaction {
  object_id: string; // Transaction ID
  status: string; // "SUCCESS" | "ERROR"
  tracking_number?: string; // Tracking number (may be null in test mode)
  carrier: string; // "usps" | "ups" | "fedex" | "dhl"
  label_url?: string; // Label PDF URL
  label_url_pdf?: string; // Alternative label URL
  tracking_url_provider?: string; // Carrier tracking URL
  messages?: Array<{
    // Error messages (if status === "ERROR")
    text: string;
    code?: string;
  }>;
}
```

---

## Configuration

### Environment Variables

#### Lambda Environment Variables

**Location**: AWS Lambda Console or `template.yaml`

```bash
# Shippo API Key (required)
SHIPPO_API_KEY=shippo_test_...  # Test key (starts with "shippo_test_")
# OR
SHIPPO_API_KEY=shippo_live_...  # Production key (starts with "shippo_live_")

# Sender Address (optional - defaults provided)
SHIPPO_FROM_NAME="CodeBook Store"
SHIPPO_FROM_STREET1="123 Main St"
SHIPPO_FROM_CITY="New York"
SHIPPO_FROM_STATE="NY"
SHIPPO_FROM_ZIP="10001"
SHIPPO_FROM_COUNTRY="US"
SHIPPO_FROM_PHONE="+1 555 123 4567"  # Required for USPS
SHIPPO_FROM_EMAIL="store@example.com" # Required for USPS
```

#### Frontend Environment Variables

**Location**: `.env` (optional - for reference only)

```bash
# Shippo API Key (for frontend reference, actual key used in Lambda)
REACT_APP_SHIPPO_API_KEY=shippo_test_...
```

**Note**: Shippo API key should **NOT** be exposed in frontend code. It's only used in Lambda functions.

---

### AWS SAM Template Configuration

**Location**: `codebook/aws-lambda/template.yaml`

```yaml
Globals:
  Function:
    Environment:
      Variables:
        SHIPPO_API_KEY: !Ref ShippoApiKey # Parameter reference

# Lambda Function Definition
AdminGenerateLabelFunction:
  Type: AWS::Serverless::Function
  Properties:
    Handler: functions/admin/generate-label.handler
    Events:
      HttpApi:
        Type: HttpApi
        Properties:
          Path: /admin/orders/{id}/generate-label
          Method: post
    Policies:
      - DynamoDBReadPolicy:
          TableName: codebook-orders
      - DynamoDBWritePolicy:
          TableName: codebook-orders
```

---

## Error Handling

### Common Errors

#### 1. "Shippo API key not configured"

**Cause**: `SHIPPO_API_KEY` environment variable not set  
**Solution**: Set `SHIPPO_API_KEY` in Lambda environment variables

#### 2. "Seller info missing email or phone"

**Cause**: USPS requires both email and phone for sender address  
**Solution**: Set `SHIPPO_FROM_EMAIL` and `SHIPPO_FROM_PHONE` environment variables

#### 3. "Recipient address invalid: Address not found"

**Cause**: Invalid or incomplete recipient address  
**Solution**:

- Ensure address is complete (street, city, state, zip)
- Use valid US addresses
- In test mode, function uses default test address if incomplete

#### 4. "CarrierAccountsRequest CarrierAccountObjectIDs must be valid v4 UUIDs"

**Cause**: Attempting to use `carrier_accounts` parameter with invalid UUIDs  
**Solution**:

- In test mode, function filters rates to USPS only (no carrier accounts needed)
- In production, register carrier accounts in Shippo dashboard first

#### 5. "No shipping rates available"

**Cause**: No rates returned for shipment  
**Solution**:

- Check address validity
- Verify parcel dimensions
- Ensure carrier is available in your region

#### 6. "Shippo transaction failed"

**Cause**: Transaction status is "ERROR"  
**Solution**: Check `transaction.messages` for specific error details

### Error Response Format

```json
{
  "message": "Error message here",
  "error": "Optional detailed error"
}
```

### Frontend Error Handling

```javascript
try {
  const result = await generateShippingLabel(orderId, options);
} catch (error) {
  // error is ApiError instance
  console.error("Status:", error.status); // HTTP status code
  console.error("Message:", error.message); // Error message
}
```

---

## Test Mode vs Production

### Test Mode

**API Key Format**: `shippo_test_...`

**Features**:

- ✅ No charges for label generation
- ✅ Test tracking numbers generated (format: `TEST-XXXXXXXXXXXX`)
- ✅ No actual labels created
- ✅ USPS rates only (no carrier registration required)
- ✅ Address validation may be less strict

**Limitations**:

- ❌ Tracking numbers are fake (won't work on carrier websites)
- ❌ Labels are not real (can't be used for shipping)
- ❌ Limited to USPS in test mode (to avoid registration errors)

**Test Tracking Number Generation**:

```javascript
// If Shippo doesn't return tracking_number in test mode:
const idSource =
  transaction.object_id?.replace(/[^a-zA-Z0-9]/g, "") || Date.now().toString();
const testTrackingNumber = `TEST-${idSource.slice(-12).toUpperCase()}`;
```

### Production Mode

**API Key Format**: `shippo_live_...`

**Features**:

- ✅ Real shipping labels generated
- ✅ Real tracking numbers (work on carrier websites)
- ✅ All carriers available (after registration)
- ✅ Actual charges apply per label

**Requirements**:

- Carrier account registration (for UPS, FedEx, DHL)
- Valid sender address with email and phone
- Valid recipient addresses
- Payment method on file with Shippo

### Switching Between Modes

**Test → Production**:

1. Get production API key from Shippo dashboard
2. Update `SHIPPO_API_KEY` in Lambda environment variables
3. Register carrier accounts (if using UPS/FedEx/DHL)
4. Update sender address to real business address
5. Test with small order first

**Production → Test**:

1. Replace `shippo_live_...` with `shippo_test_...`
2. No other changes needed (test mode is more forgiving)

---

## Pros & Cons

### Pros ✅

1. **Multiple Carrier Support**
   - USPS, UPS, FedEx, DHL all in one API
   - Easy to switch carriers or compare rates

2. **Automatic Label Generation**
   - No manual label creation needed
   - PDF labels ready to print

3. **Address Validation**
   - Automatic address validation
   - Reduces shipping errors

4. **Real-Time Rates**
   - Get current shipping rates
   - Compare options before purchase

5. **Test Mode**
   - Free testing without charges
   - Safe to develop and test

6. **Tracking Integration**
   - Automatic tracking number assignment
   - Tracking URLs provided

7. **Hybrid Approach**
   - API integration + manual fallback
   - Flexible for different scenarios

### Cons ❌

1. **Carrier Registration Required**
   - UPS, FedEx, DHL need account registration
   - USPS doesn't require registration (good for test mode)

2. **Address Requirements**
   - USPS requires email and phone for sender
   - Strict address validation

3. **Test Mode Limitations**
   - Fake tracking numbers
   - No real labels
   - Limited to USPS

4. **Costs in Production**
   - Per-label charges
   - Carrier-specific pricing

5. **API Complexity**
   - Multiple API calls (shipment → rates → transaction)
   - Error handling required at each step

6. **Dependency on Third Party**
   - Shippo service availability
   - API changes may require updates

---

## Implementation Examples

### Example 1: Generate Label with Default Options

```javascript
import { useGenerateShippingLabel } from "../../hooks/useAdmin";

function AdminOrderDetailPage() {
  const generateLabelMutation = useGenerateShippingLabel();

  const handleGenerateLabel = () => {
    generateLabelMutation.mutate({
      orderId: order.id,
      options: {}, // Uses defaults
    });
  };

  return (
    <button
      onClick={handleGenerateLabel}
      disabled={generateLabelMutation.isPending}
    >
      {generateLabelMutation.isPending ? "Generating..." : "Generate Label"}
    </button>
  );
}
```

### Example 2: Generate Label with Custom Options

```javascript
const handleGenerateLabel = () => {
  generateLabelMutation.mutate({
    orderId: order.id,
    options: {
      carrier: "usps",
      service: "priority",
      length: "12",
      width: "10",
      height: "6",
      fromAddress: {
        name: "My Store",
        street1: "123 Business St",
        city: "New York",
        state: "NY",
        zip: "10001",
        country: "US",
        phone: "+1 555 123 4567",
        email: "store@example.com",
      },
    },
  });
};
```

### Example 3: Add Manual Tracking

```javascript
import { useAddTrackingNumber } from "../../hooks/useAdmin";

function AdminOrderDetailPage() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("usps");
  const addTrackingMutation = useAddTrackingNumber();

  const handleAddTracking = () => {
    addTrackingMutation.mutate({
      orderId: order.id,
      trackingNumber: trackingNumber.trim(),
      trackingCarrier: carrier,
      status: "shipped",
    });
  };

  return (
    <div>
      <input
        value={trackingNumber}
        onChange={(e) => setTrackingNumber(e.target.value)}
        placeholder="Enter tracking number"
      />
      <select value={carrier} onChange={(e) => setCarrier(e.target.value)}>
        <option value="usps">USPS</option>
        <option value="ups">UPS</option>
        <option value="fedex">FedEx</option>
        <option value="dhl">DHL</option>
      </select>
      <button
        onClick={handleAddTracking}
        disabled={addTrackingMutation.isPending}
      >
        Add Tracking
      </button>
    </div>
  );
}
```

### Example 4: Display Tracking Info

```javascript
import { OrderTrackingInfo } from "../../components/ui";

function CustomerDashboard() {
  const { data: orders } = useQuery({
    queryKey: ["user-orders"],
    queryFn: fetchUserOrders,
  });

  return (
    <div>
      {orders?.map((order) => (
        <div key={order.id}>
          <h3>Order {order.id}</h3>
          {/* Tracking info automatically shows/hides based on order status */}
          <OrderTrackingInfo order={order} />
        </div>
      ))}
    </div>
  );
}
```

### Example 5: Custom Error Handling

```javascript
const generateLabelMutation = useGenerateShippingLabel();

const handleGenerateLabel = async () => {
  try {
    const result = await generateLabelMutation.mutateAsync({
      orderId: order.id,
      options: {},
    });

    // Custom success handling
    console.log("Label generated:", result.trackingNumber);

    // Custom email or notification
    await sendCustomNotification(result);
  } catch (error) {
    // Custom error handling
    if (error.status === 400) {
      // Handle validation errors
      showValidationError(error.message);
    } else if (error.status === 503) {
      // Handle service unavailable
      showServiceUnavailableError();
    } else {
      // Handle other errors
      showGenericError(error.message);
    }
  }
};
```

---

## Best Practices

### 1. Always Use Test Mode for Development

```bash
# Use test API key during development
SHIPPO_API_KEY=shippo_test_...
```

### 2. Validate Addresses Before Generating Labels

```javascript
// Check if order has complete shipping address
const hasValidAddress =
  order.shippingAddress?.street1 &&
  order.shippingAddress?.city &&
  order.shippingAddress?.state &&
  order.shippingAddress?.zip;

if (!hasValidAddress) {
  // Show error or use default test address
}
```

### 3. Handle Test Mode Tracking Numbers

```javascript
// Check if tracking number is test mode
const isTestTracking = trackingNumber?.startsWith("TEST-");

if (isTestTracking) {
  // Show warning to admin: "Test tracking number - not valid for real shipping"
}
```

### 4. Provide Fallback for Manual Entry

```javascript
// Always provide manual entry option
{
  !order.trackingNumber && (
    <>
      <button onClick={handleGenerateLabel}>Generate Label (Shippo)</button>
      <div>
        <input placeholder="Or enter manually" />
        <button onClick={handleAddTracking}>Add Tracking</button>
      </div>
    </>
  );
}
```

### 5. Cache Order Data After Updates

```javascript
// React Query automatically invalidates and refetches
// But you can also manually refetch if needed
const queryClient = useQueryClient();

await generateLabelMutation.mutateAsync({ orderId, options });

// Manually refetch if needed
await queryClient.refetchQueries({ queryKey: ["admin-order", orderId] });
```

### 6. Send Email Notifications

```javascript
// Hooks automatically send emails, but you can also send custom emails
import { sendShippingNotificationEmail } from "../services/emailService";

await sendShippingNotificationEmail({
  customerEmail: order.user.email,
  customerName: order.user.name,
  orderId: order.id,
  trackingNumber: result.trackingNumber,
  trackingCarrier: result.trackingCarrier,
  trackingUrl: result.trackingUrl,
});
```

### 7. Log Important Events

```javascript
// Log for debugging and monitoring
console.log("📦 SHIPPING LABEL GENERATION SUCCESS:", {
  "Order ID": orderId,
  "Tracking Number": result.trackingNumber,
  Carrier: result.trackingCarrier,
  "Label URL": result.labelUrl,
  Timestamp: new Date().toISOString(),
});
```

### 8. Handle Cancelled/Refunded Orders

```javascript
// OrderTrackingInfo component automatically hides tracking for cancelled/refunded
// But you should also prevent label generation for these orders
if (order.status === "cancelled" || order.status === "refunded") {
  // Disable label generation button
  return <p>Cannot generate label for cancelled/refunded order</p>;
}
```

---

## Troubleshooting

### Issue: "Tracking number is undefined" in toast

**Cause**: Shippo didn't return tracking number in test mode  
**Solution**: Function generates test tracking number automatically. Check console logs for "Generated test tracking number".

### Issue: "No USPS rates available in test mode"

**Cause**: Address validation failed or incomplete address  
**Solution**:

- Ensure complete address (street, city, state, zip)
- Function uses default test address if incomplete
- Check Shippo API logs for specific validation errors

### Issue: Label generation takes too long

**Cause**: Shippo API is slow or timeout  
**Solution**:

- Lambda timeout is 30 seconds (should be enough)
- Check Shippo API status
- Consider using `async: true` for large batches (not implemented)

### Issue: Email not sent after label generation

**Cause**: Email service error or missing user data  
**Solution**:

- Check that order has `user` object with email
- Check email service logs
- Email sending is async (non-blocking) - check for errors in console

### Issue: Tracking info not showing on customer dashboard

**Cause**: Order status not "shipped" or "delivered", or order is cancelled/refunded  
**Solution**:

- Check order status in database
- Verify `trackingNumber` field exists
- Check `OrderTrackingInfo` component logic (hides for cancelled/refunded)

### Issue: "Carrier account not registered" error

**Cause**: Trying to use UPS/FedEx/DHL without registration  
**Solution**:

- In test mode, function filters to USPS only (no registration needed)
- In production, register carrier accounts in Shippo dashboard first

### Issue: Address validation fails

**Cause**: Invalid or incomplete address  
**Solution**:

- Use valid US addresses
- Ensure all required fields (street, city, state, zip)
- In test mode, function uses default test address if incomplete

---

## Additional Resources

### Shippo Documentation

- **API Reference**: <https://docs.goshippo.com/>
- **Test Mode Guide**: <https://docs.goshippo.com/article/12-test-mode>
- **Address Validation**: <https://docs.goshippo.com/article/10-address-validation>
- **Carrier Registration**: <https://docs.goshippo.com/article/11-carrier-accounts>

### Related Project Files

- **Lambda Function**: `codebook/aws-lambda/functions/admin/generate-label.js`
- **Manual Tracking**: `codebook/aws-lambda/functions/admin/add-tracking.js`
- **Order Tracking Update**: `codebook/aws-lambda/shared/orders.js` (updateOrderTracking)
- **React Hook**: `codebook/src/hooks/useAdmin.js` (useGenerateShippingLabel, useAddTrackingNumber)
- **Service**: `codebook/src/services/adminService.js` (generateShippingLabel, addTrackingNumber)
- **UI Component**: `codebook/src/components/ui/order-tracking-info.js`
- **Admin Page**: `codebook/src/pages/Admin/AdminOrderDetailPage.js`

---

**Last Updated**: 2025-12-06  
**Version**: 1.0.0  
**Status**: Production Ready ✅
