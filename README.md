# throtld
Node based service for managing and throttling groups feature flags based on JSON web tokens

## Data Structure

### App
* ID ( String: UUID )
* Secret ( String )
* Features ( Map )
  * Name/Key ( String: `/^[\w-]{1,255}$/` )
  * Segments ( Array )
    * Value ( String/Number/Boolean )
    * Weight ( Number )

### User
* ID ( String: JWT Sig )
* App ( String: UUID )
* Expiry ( Number: Unix Timestamp )
* Features ( Map )
  * Name/Key ( String: `/^[\w-]{1,255}$/` )
  * Value ( String/Number/Boolean )

## API ( TODO: Describe shared secret security )

### `POST /v1/app`
**\>\>\>** `Encoded with shared secret ( config )`
```
{
  secret: ( String to use as secret )
}
```
**<<<** `Encoded with shared secret ( config )`
```
{
  id: ( String UUID to identify App in JWT header )
}
```

### `DELETE /v1/app`
**\>\>\>** `Encoded with shared secret ( config )`
```
{
  id: ( String UUID to identify App )
}
```
**<<<** `HTTP 200`

### `GET /v1/apps`
**<<<** `Encoded with shared secret ( config )`
```
[
  ( App UUID ),
  ( App UUID )...
]
```

### `PUT /v1/app/feature`
**\>\>\>** `Encoded with shared secret ( config )`
```
{
  id: ( String UUID to identify App ),
  feature: {
    key: ( String: /^[\w-]{1,255}$/ ),
    segments: [
      {
        value: ( String/Number/Boolean ),
        weight: ( Number )
      }
    ]
  }
}
```
**<<<** `HTTP 200`

### `DELETE /v1/app/feature`
**\>\>\>** `Encoded with shared secret ( config )`
```
{
  id: ( String UUID to identify App ),
  feature: {
    key: ( String: /^[\w-]{1,255}$/ )
  }
}
```
**<<<** `HTTP 200`

### `GET /v1/features`
**\>\>\>**
`JWT signed and payload encoded with App secret, header containing App id`

**<<<**
```
{
  [key]: [value],
  [key]: [value]...
}
```
