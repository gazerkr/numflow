/**
 * Step 100: Validate TODO input
 */

export default async (ctx, req, res) => {
  const { todoText } = ctx

  if (!todoText || todoText.trim() === '') {
    throw new Error('Please enter TODO content')
  }

  if (todoText.length > 200) {
    throw new Error('Please enter TODO within 200 characters')
  }

  ctx.validatedText = todoText.trim()
}
