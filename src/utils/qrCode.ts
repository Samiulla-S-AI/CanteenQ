import QRCode from 'qrcode'

export interface QRCodeData {
  email: string
  orderId: string
  orderNumber: string
  canteenId: string
  timestamp: string
}

export const generateQRCode = async (data: QRCodeData): Promise<string> => {
  try {
    const qrData = JSON.stringify(data)
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    return qrCodeDataURL
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw error
  }
}

export const parseQRCode = (qrData: string): QRCodeData | null => {
  try {
    // Check if the qrData is a data URL (starts with 'data:image')
    if (qrData.startsWith('data:image')) {
      console.error('Received image data URL instead of JSON string')
      return null
    }
    
    // Try to parse as JSON
    const parsedData = JSON.parse(qrData)
    
    // Validate the required fields
    if (!parsedData.email || !parsedData.orderId || !parsedData.orderNumber || !parsedData.canteenId) {
      console.error('Invalid QR code data: missing required fields', parsedData)
      return null
    }
    
    return parsedData
  } catch (error) {
    console.error('Error parsing QR code data:', error)
    return null
  }
}