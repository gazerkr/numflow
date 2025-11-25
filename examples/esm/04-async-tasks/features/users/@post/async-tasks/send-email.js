// AsyncTask: Run in background after client response
export default async (ctx) => {
  console.log('📧 AsyncTask 1: Start sending email (background)')

  // Email sending simulation (2 seconds)
  await new Promise(resolve => setTimeout(resolve, 2000))

  console.log(`📧 Email sent: ${ctx.email}`)

  // AsyncTask cannot access req, res!
  // Only ctx is available
}
