// app/api/register/route.ts
import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { ethers } from "ethers";

interface Registration {
  walletType: "EVM" | "Movement";
  address: string;
  timestamp: number;
}

// Path to our “database” file
const dbFilePath = path.join(process.cwd(), "data", "registrations.json");

// Helper function to load registrations
async function loadRegistrations(): Promise<Registration[]> {
  try {
    const data = await fs.readFile(dbFilePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.log(error)
    return [];
  }
}

// Helper function to save registrations
async function saveRegistration(registration: Registration) {
  const registrations = await loadRegistrations();
  registrations.push(registration);
  await fs.writeFile(dbFilePath, JSON.stringify(registrations, null, 2));
}

export async function POST(request: Request) {
  try {
    const { walletType, address, connectionSignature, registrationSignature } = await request.json();

    // Basic validation
    if (!walletType || !address) {
      return NextResponse.json({ message: "Missing required fields." }, { status: 400 });
    }

    // --- Ownership Verification ---
    if (walletType === "EVM") {
      // Verify both signatures
      const connectionMessage = `I approve connecting my wallet ${address} to this application.`;
      const challengeMessage = "Please sign this message to verify wallet ownership for registration.";
      
      try {
        // Verify connection signature
        const recoveredConnectionAddress = ethers.verifyMessage(connectionMessage, connectionSignature);
        if (recoveredConnectionAddress.toLowerCase() !== address.toLowerCase()) {
          return NextResponse.json({ message: "Connection signature verification failed." }, { status: 401 });
        }

        // Verify registration signature
        const recoveredRegistrationAddress = ethers.verifyMessage(challengeMessage, registrationSignature);
        if (recoveredRegistrationAddress.toLowerCase() !== address.toLowerCase()) {
          return NextResponse.json({ message: "Registration signature verification failed." }, { status: 401 });
        }
      } catch (error) {
        console.log(error);
        return NextResponse.json({ message: "Error verifying signatures." }, { status: 500 });
      }
    } else if (walletType === "Movement") {
      // For Movement wallets, implement appropriate verification.
      // For now, we simulate that the provided address is verified.
      // In a real implementation, you might verify signatures or query on-chain data.
    }

    // --- Prevent Duplicate Registrations ---
    const registrations = await loadRegistrations();
    const alreadyRegistered = registrations.some(
      (reg) => reg.address.toLowerCase() === address.toLowerCase()
    );
    if (alreadyRegistered) {
      return NextResponse.json({ message: "Wallet already registered." }, { status: 409 });
    }

    // --- Bot / Sybil Prevention (Basic) ---
    // Example: You could check request IPs or include a CAPTCHA token.
    // Here, you might implement rate limiting or add a CAPTCHA verification step.
    // (This is described in the README as part of your anti-bot strategy.)

    // Create new registration record
    const newRegistration: Registration = {
      walletType,
      address,
      timestamp: Date.now(),
    };

    await saveRegistration(newRegistration);
    return NextResponse.json({ message: "Wallet registered successfully." });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error." }, { status: 500 });
  }
}
