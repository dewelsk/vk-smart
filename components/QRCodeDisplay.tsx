'use client'

import Image from 'next/image'

interface QRCodeDisplayProps {
    qrCodeDataURL: string
    secret: string
    userEmail: string
}

export function QRCodeDisplay({ qrCodeDataURL, secret, userEmail }: QRCodeDisplayProps) {
    const copySecret = () => {
        navigator.clipboard.writeText(secret)
    }

    return (
        <div className="space-y-4" data-testid="qr-code-display">
            <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">
                    Naskenujte QR kód
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                    Použite autentifikačnú aplikáciu (Google Authenticator, Authy, atď.)
                </p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                    <Image
                        src={qrCodeDataURL}
                        alt="2FA QR Code"
                        width={200}
                        height={200}
                        data-testid="qr-code-image"
                    />
                </div>
            </div>

            {/* Manual entry option */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700 mb-2 font-medium">
                    Alebo zadajte kľúč manuálne:
                </p>
                <div className="flex items-center gap-2">
                    <code
                        className="flex-1 bg-white px-3 py-2 rounded border border-gray-300 text-sm font-mono break-all"
                        data-testid="secret-code"
                    >
                        {secret}
                    </code>
                    <button
                        onClick={copySecret}
                        className="px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                        data-testid="copy-secret-button"
                    >
                        Kopírovať
                    </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    Účet: {userEmail}
                </p>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">
                    Inštrukcie:
                </h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Otvorte autentifikačnú aplikáciu</li>
                    <li>Naskenujte QR kód alebo zadajte kľúč manuálne</li>
                    <li>Zadajte 6-miestny kód z aplikácie nižšie</li>
                </ol>
            </div>
        </div>
    )
}
