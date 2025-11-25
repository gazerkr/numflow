// AsyncTask 2: Update analytics data
export default async (ctx) => {
  console.log('📊 AsyncTask 2: Start updating analytics')

  // Analytics update simulation (1 second)
  await new Promise(resolve => setTimeout(resolve, 1000))

  console.log(`📊 Analytics complete: User ${ctx.userId} registered`)

  // AsyncTask failures don't affect response!
}
