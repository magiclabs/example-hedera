import React, { useState, useEffect } from "react";
import "./styles.css";
import {
    AccountId,
    TransferTransaction
} from "@hashgraph/sdk";
import { MagicProvider } from './MagicProvider'
import { MagicWallet } from './MagicWallet'
import { HederaExtension } from '@magic-ext/hedera'

import { Magic } from "magic-sdk";


const magic = new Magic("pk_live_06D5F65BB9CDD2F0", {
    endpoint: 'http://localhost:3014',
    extensions: [new HederaExtension({
        network: 'testnet'
    })]
});

export default function App() {
    const [email, setEmail] = useState("");
    const [publicAddress, setPublicAddress] = useState("");
    const [destinationAddress, setDestinationAddress] = useState("");
    const [sendAmount, setSendAmount] = useState(0);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userMetadata, setUserMetadata] = useState({});
    const [sendingTransaction, setSendingTransaction] = useState(false);

    useEffect(() => {
        magic.user.isLoggedIn().then(async magicIsLoggedIn => {
            setIsLoggedIn(magicIsLoggedIn);
            if (magicIsLoggedIn) {
                const publicAddress = (await magic.user.getMetadata()).publicAddress;
                setPublicAddress(publicAddress);
                setUserMetadata(await magic.user.getMetadata());
            }
        });
    }, [isLoggedIn]);

    const login = async () => {
        await magic.auth.loginWithMagicLink({ email });
        setIsLoggedIn(true);
    };

    const logout = async () => {
        await magic.user.logout();
        setIsLoggedIn(false);
    };

    const handleHederaSignTransaction = async () => {
        const { publicKeyDer } = await magic.hedera.getPublicKey()

        const magicSign = message => magic.hedera.sign(message);
        const magicWallet = new MagicWallet(publicAddress, new MagicProvider('testnet'), publicKeyDer, magicSign)

        let transaction = await new TransferTransaction()
            .setNodeAccountIds([new AccountId(3)])
            .addHbarTransfer(publicAddress, -1 * sendAmount)
            .addHbarTransfer(destinationAddress, sendAmount)
            .freezeWithSigner(magicWallet);



        transaction = await transaction.signWithSigner(magicWallet);
        const result = await transaction.executeWithSigner(magicWallet);
        const receipt = await result.getReceiptWithSigner(magicWallet);

        setSendingTransaction(true)

        console.log(receipt.status.toString());
    }

    return (
        <div className="App">
            {!isLoggedIn ? (
                <div className="container">
                    <h1>Please sign up or login</h1>
                    <input
                        type="email"
                        name="email"
                        required="required"
                        placeholder="Enter your email"
                        onChange={event => {
                            setEmail(event.target.value);
                        }}
                    />
                    <button onClick={login}>Send</button>
                </div>
            ) : (
                <div>
                    <div className="container">
                        <h1>Current user: {userMetadata.email}</h1>
                        <button onClick={logout}>Logout</button>
                    </div>
                    <div className="container">
                        <h1>Hedera account ID</h1>
                        <div className="info">
                            {publicAddress}
                        </div>
                    </div>
                    <div className="container">
                        <h1>Send Transaction</h1>
                        {
                            sendingTransaction ?
                                <div>
                                    <div>
                                        Send transaction success
                                    </div>
                                </div>
                                :
                                <div/>
                        }
                        <input
                            type="text"
                            name="destination"
                            className="full-width"
                            required="required"
                            placeholder="Destination account id"
                            onChange={event => {
                                setDestinationAddress(event.target.value);
                            }}
                        />
                        <input
                            type="text"
                            name="amount"
                            className="full-width"
                            required="required"
                            placeholder="Amount in Har"
                            onChange={event => {
                                setSendAmount(event.target.value);
                            }}
                        />
                        <button id="btn-send-txn" onClick={handleHederaSignTransaction}>
                            Send Transaction
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
