export const getTimeAgo = (date: Date | undefined): string => {
  if (!date) {
    return ''
  }

  const dateObj = new Date(date)
  const now = new Date()
  const diffInMilliseconds = now.getTime() - dateObj.getTime()

  const oneHour = 60 * 60 * 1000 // milliseconds in an hour
  const oneDay = 24 * oneHour // milliseconds in a day
  const oneWeek = 7 * oneDay // milliseconds in a week

  if (diffInMilliseconds < oneDay) {
    const hours = Math.max(1, Math.floor(diffInMilliseconds / oneHour))
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  } else if (diffInMilliseconds < oneWeek) {
    const days = Math.floor(diffInMilliseconds / oneDay)
    return `${days} day${days !== 1 ? 's' : ''} ago`
  } else {
    const weeks = Math.floor(diffInMilliseconds / oneWeek)
    return `${weeks} week${weeks !== 1 ? 's' : ''} ago`
  }
}
