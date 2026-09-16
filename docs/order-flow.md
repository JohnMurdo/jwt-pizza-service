# JWT Pizza route trace and final table update

This file reflects the routes actually implemented in the service code and the database queries they trigger.

## Route trace

```mermaid
flowchart TD
    A[User visits app] --> B{Route hit}
    B --> C[POST /api/auth]
    B --> D[PUT /api/auth]
    B --> E[GET /api/user/me]
    B --> F[GET /api/order/menu]
    B --> G[POST /api/order]
    B --> H[GET /api/franchise]
    B --> I[GET /api/franchise/:userId]
    B --> J[POST /api/franchise]
    B --> K[POST /api/franchise/:franchiseId/store]
    B --> L[DELETE /api/franchise/:franchiseId/store/:storeId]
    B --> M[DELETE /api/franchise/:franchiseId]

    C --> C1[DB.addUser]
    D --> D1[DB.getUser]
    E --> E1[req.user from JWT auth middleware]
    F --> F1[DB.getMenu]
    G --> G1[DB.addDinerOrder]
    G1 --> G2[INSERT INTO dinerOrder]
    G1 --> G3[SELECT id FROM menu WHERE id=?]
    G1 --> G4[INSERT INTO orderItem]

    H --> H1[DB.getFranchises]
    H1 --> H2[SELECT id, name FROM franchise WHERE name LIKE ?]
    I --> I1[DB.getUserFranchises]
    I1 --> I2[SELECT objectId FROM userRole WHERE role='franchisee' AND userId=?]
    I1 --> I3[SELECT id, name FROM franchise WHERE id in (...)]

    J --> J1[DB.createFranchise]
    J1 --> J2[INSERT INTO franchise]
    J1 --> J3[INSERT INTO userRole]

    K --> K1[DB.createStore]
    K1 --> K2[INSERT INTO store (franchiseId, name) VALUES (?, ?)]

    L --> L1[DB.deleteStore]
    L1 --> L2[DELETE FROM store WHERE franchiseId=? AND id=?]

    M --> M1[DB.deleteFranchise]
    M1 --> M2[DELETE FROM store WHERE franchiseId=?]
    M1 --> M3[DELETE FROM userRole WHERE objectId=?]
    M1 --> M4[DELETE FROM franchise WHERE id=?]
```

## What was actually happening

1. Auth flow
   - `POST /api/auth` creates a user and logs them in.
   - `PUT /api/auth` logs an existing user in.
   - `DELETE /api/auth` removes the token from `auth`.

2. Order flow
   - `GET /api/order/menu` reads the menu from the `menu` table.
   - `POST /api/order` inserts the order in `dinerOrder` and each line item in `orderItem`.

3. Franchise flow
   - `GET /api/franchise` lists franchises.
   - `GET /api/franchise/:userId` lists the franchises attached to a user.
   - `POST /api/franchise` creates a franchise.
   - `POST /api/franchise/:franchiseId/store` creates a store in that franchise.
   - `DELETE /api/franchise/:franchiseId/store/:storeId` deletes a store.
   - `DELETE /api/franchise/:franchiseId` deletes the franchise and related rows.

## Final table verdict

Anything not implemented in the backend is marked as `none`, not guessed. That includes items like the external factory verification step, which is not backed by a local route in this service code.