import webpush from 'web-push'

const keys = webpush.generateVAPIDKeys()
console.log('VAPID_PUBLIC_KEY=' + keys.publicKey)
console.log('VAPID_PRIVATE_KEY=' + keys.privateKey)
console.log('VAPID_SUBJECT=mailto:hello@seeneyu.com')
console.log('\nAlso set NEXT_PUBLIC_VAPID_PUBLIC_KEY to the same public key value.')
console.log('\nAdd these to your .env and Vercel environment variables.')
