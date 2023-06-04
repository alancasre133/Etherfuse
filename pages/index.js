import * as web3 from "@solana/web3.js"
import * as sdk from "@hxronetwork/parimutuelsdk"
import Image from "next/image";
import { Inter } from "next/font/google";

import { SigningKey } from "ethers/lib/utils";
import  toast, {Toaster} from "react-hot-toast";
import React, {useState,UseEffect, useEffect} from "react"; //Use Effect es una funcion que se ejecuta de manera automatica
import { useRouter } from "next/router";
import { useStorageUpload } from "@thirdweb-dev/react";
import {
    Connection,
    SystemProgram,
    Transaction,
    PublicKey,
    LAMPORTS_PER_SOL,
    clusterApiUrl,
    SendTransactionError,
} from "@solana/web3.js"

import axios from "axios";

const SOLANA_NETWORK = "devnet" // cambiar la red con la que estamos trabajando
const inter = Inter({subsets: ["latin"] });
const psdk = require("@hxronetwork/parimutuelsdk");
const config = sdk.DEV_CONFIG;
const rpc = web3.clusterApiUrl('devnet')

const connection = new web3.Connection(rpc, "confirmed");

const parimutuelWeb3 = new sdk.ParimutuelWeb3(config, connection);
const market = sdk.MarketPairEnum.BTCUSD;
const markets = sdk.getMarketPubkeys(config, market);
const marketTerm = 60; // The expires are in seconds, so this would be the 1 min
const marketsByTime = markets.filter(
  (market) => market.duration === marketTerm
);

const Paris = async () => {

  const parimutuels = await parimutuelWeb3.getParimutuels(marketsByTime, 5);

  console.log(`\\nMarket Pair: BTCUSD\\nMarket Expiry Interval: 1 min\\n`)

  const usdcDec = 1_000_000 

  parimutuels.forEach((cont) => {
      const strike = cont.info.parimutuel.strike.toNumber() / usdcDec
			const slotId = cont.info.parimutuel.slot.toNumber()
			const longSide = cont.info.parimutuel.activeLongPositions.toNumber() / usdcDec
			const shortSide = cont.info.parimutuel.activeShortPositions.toNumber() / usdcDec
			const expired = cont.info.parimutuel.expired
    console.log(`\\nStrike: ${strike}\\nSlot: ${slotId}\\nLongs: ${longSide}\\nShorts: ${shortSide}\\nExprired?: ${expired? 'true' : 'false'}`)
  })
};

const Paris2 = async () => {

    const parimutuels = await parimutuelWeb3.getParimutuels(marketsByTime, 4);
  
    console.log(JSON.stringify(parimutuels[0]))
  };

const Home = () => {
    const [paris,setParis] = useState(null);
    const [publicKey, setPublicKey] = useState(null); // variable para obtener la direccion de nuestra wallet y consultarla
    const [balance, setBalance] = useState(0);
    const router = useRouter();
    const [chat, setChat] = useState(null);
    const [receiver, setReceiver] = useState(null);
    const [amount, setAmount] = useState(null);
    const [explorerLink, setExplorerLink] = useState(null);
    //URL del IPFS a subir
    const [uploadUrl, setUploadUrl] = useState(null);
    const [url, setUrl] = useState(null);
    const [statusText, setStatusText] = useState("");
   //Funcion para crear un NFT
   const generateNFT = async () => {
    try {
        setStatusText("Creando tu NFT...❤");
        const mintedData = {
            name: "Mi primer NFT con Superteam MX",
            imageUrl: uploadUrl,
            publicKey,
        };
        console.log("Este es el objeto mintedData:", mintedData);
        setStatusText(
            "Minteando tu NFT en la blockchain Solana 🚀 Porfavor espera..."
        );
        const { data } = await axios.post("/api/mintnft", mintedData); // se envia el nft a la api en el archivo llamado mintnft api
        const { signature: newSignature } = data;
        const solanaExplorerUrl = `https://solscan.io/tx/${newSignature}?cluster=${SOLANA_NETWORK}`;
        console.log("solanaExplorerUrl", solanaExplorerUrl);
        setStatusText(
            "¡Listo! Tu NFT se a creado, revisa tu Phantom Wallet 🖖"
        );
    } catch (error) {
        console.error("ERROR GENERATE NFT", error);
        toast.error("Error al generar el NFT");
    }
};
    //funcion de persistencia, se ejecuta siempre que recargamos o volvemos a la pagina
    const UseEffect = (() => {
        const getParis = async () => {
        let key = window.localStorage.getItem("publicKey"); // obtiene la direccion de la wallet almacenada en la cache del navegador del usuario
        setPublicKey(key);
        if (key) getBalances(key);
        if (explorerLink) setExplorerLink(null);
        const config = sdk.DEV_CONFIG;
        const rpc = web3.clusterApiUrl("devnet");
        const connection = new web3.Connection(rpc,"confirmed");

        console.log("connecting to network",connection);

        const parimutuelweb3 = new sdk.ParimutuelWeb3(config,connection);
        console.log("parimutualweb3",parimutuelweb3);
        const market = sdk.MarketPairEnum.HXROUSD;
        console.log("market",market);
        const markets = sdk.getMarketPubkeys(config,market);
        console.log("markets",markets);

        const parimutuels = await parimutuelweb3.getParimutuels(markets,5);
        console.log("parimutuels",parimutuels);
        setParis(parimutuels);
        };
    getParis();
},[])
    const handleReceiverChange = (event) => {
        setReceiver(event.target.value);
    };
    const handleReceiverChange2 = (event) => {
        setReceiver(event.target.value);
    };

    const handleAmountChange = (event) => {
        setAmount(event.target.value);
    };

    const handleSubmit = async () => {
        console.log("Este es el receptor", receiver);
        console.log("Este es el monto", amount);
        sendTransaction();
    };
    const chatStart = async (event) => {
      setChat(chat);
  };    
    const handleSubmit2 = async () => {
        console.log("Este es el receptor", receiver);
        console.log("Este es el monto", amount);
        const rpc = web3.clusterApiUrl("devnet");
        const connection = new web3.Connection(rpc,"confirmed");
        UserPositions();
        placePosition(amount,connection);
        Paris();
        Paris2();
    };
    const handleUrlChange = (event) => {
        setUrl(event.target.value);
        console.log("Si se esta seteando la URL", url);
    };
//funcion para enviar transacciones
const sendTransaction = async () => {
    try {
        //Consultar el balance de la wallet
        getBalances(publicKey);
        console.log("Este es el balance", balance);

        //Si el balance es menor al monto a enviar
        if (balance < amount) {
            toast.error("No tienes suficiente balance");
            return;
        }
        //Conectar a la red de solana Network en modo devnet declarado arriba
        const provider = window?.phantom?.solana;
        const connection = new Connection(
            clusterApiUrl(SOLANA_NETWORK),
            "confirmed"
        );

        //Llaves

        const fromPubkey = new PublicKey(publicKey);
        const toPubkey = new PublicKey(receiver);

        //Creamos la transaccion
        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey,
                toPubkey,
                lamports: amount * LAMPORTS_PER_SOL,
            })
        );
        console.log("Esta es la transaccion", transaction);

        //Traemos el ultimo blocke de hash
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = fromPubkey;

        //Firmamos la transaccion
        const transactionsignature = await provider.signTransaction(
            transaction
        );

        //Enviamos la transaccion
        const txid = await connection.sendRawTransaction(
            transactionsignature.serialize()
        );
        console.info(`Transaccion con numero de id ${txid} enviada`);

        //Esperamos a que se confirme la transaccion
        const confirmation = await connection.confirmTransaction(txid, {
            commitment: "singleGossip",
        });

        const { slot } = confirmation.value;

        console.info(
            `Transaccion con numero de id ${txid} confirmado en el bloque ${slot}`
        );

        const solanaExplorerLink = `https://explorer.solana.com/tx/${txid}?cluster=${SOLANA_NETWORK}`;
        setExplorerLink(solanaExplorerLink);

        toast.success("Transaccion enviada con exito :D ");

        //Actualizamos el balance
        getBalances(publicKey);
        setAmount(null);
        setReceiver(null);

        return solanaExplorerLink;
    } catch (error) {
        console.error("ERROR SEND TRANSACTION", error);
        toast.error("Error al enviar la transaccion");
    }
};

//Funcion para subir archivos a IPFS
const { mutateAsync: upload } = useStorageUpload();

const uploadToIpfs = async (file) => {
    setStatusText("Subiendo a IPFS...");
    const uploadUrl = await upload({
        data: [file],
        options: {
            uploadWithGatewayUrl: true,
            uploadWithoutDirectory: true,
        },
    });
    return uploadUrl[0];
};

    // URL a Blob
    const urlToBLob = async (file) => {
        setStatusText("Transformando url...");
        await fetch(url)
            .then((res) => res.blob())
            .then((myBlob) => {
                // logs: Blob { size: 1024, type: "image/jpeg" }

                myBlob.name = "blob.png";

                file = new File([myBlob], "image.png", {
                    type: myBlob.type,
                });
            });

        const uploadUrl = await uploadToIpfs(file);
        console.log("uploadUrl", uploadUrl);

        setStatusText(`La url de tu archivo es: ${uploadUrl} `);
        setUploadUrl(uploadUrl);

        return uploadUrl;
    };
//poner posicion

const placePosition = async (amount, connection) => {
    const config = psdk.DEV_CONFIG;
    const parimutuelWeb3 = new psdk.ParimutuelWeb3(config, connection);
    const marketPair = psdk.MarketPairEnum.BTCUSD;
    const duration = 300; // 5min
    const markets = psdk.getMarketPubkeys(config, marketPair);
    const marketFiltered = markets.filter((m) => m.duration === duration);
    const parimutuels = await parimutuelWeb3.getParimutuels(marketFiltered, 5);
    //Upcoming Pari
    const pari = parimutuels.filter(
      (p) =>
        p.info.parimutuel.timeWindowStart.toNumber() > Date.now() &&
        p.info.parimutuel.timeWindowStart.toNumber() <
          Date.now() + duration * 1000
    );
    //Expired Pari
    const livePari = parimutuels.filter(
        (p) => 
        p.info.parimutuel.timeWindowStart.toNumber() <= Date.now() &&
        p.info.parimutuel.timeWindowStart.toNumber() >
          Date.now() + duration * 1000
        );
    const expiredPari = parimutuels.filter(
        (p) => 
        p.info.parimutuel.timeWindowStart.toNumber()
         + duration * 1000 <= Date.now()
        );
        const usdcDec = 1_000_000 
    const key = pari[0].pubkey.toBase58();
    parimutuels.forEach((cont) => {
        
        const strike = cont.info.parimutuel.strike.toNumber() / usdcDec
        const index = cont.info.parimutuel.index.toNumber() /usdcDec
        const slotId = cont.info.parimutuel.slot.toNumber()
              const longSide = cont.info.parimutuel.activeLongPositions.toNumber() / usdcDec
              const shortSide = cont.info.parimutuel.activeShortPositions.toNumber() / usdcDec
              const expired = cont.info.parimutuel.expired
            expired ? (index > strike ? console.log('Ganador') : console.log('Perdedor') ): console.log('')
      //console.log(`\\nStrike: ${strike}\\nSlot: ${slotId}\\nLongs: ${longSide}\\nShorts: ${shortSide}\\nExprired?: ${expired? 'true' : 'false'}`)
    })
    const tx_hash = await parimutuelWeb3.placePosition(
      window?.phantom?.solana,
      new web3.PublicKey(key),
      amount * 1_000_000_000,
      psdk.PositionSideEnum.LONG,
      Date.now()
    );
// Codigo para saber si gano o perdio
    
console.log("TRANSACTION: " + tx_hash);
  };
  // live pari
   // posiciones
   const UserPositions = async() =>
   {
   };

    //Funcion para obtener el balance de nuestra wallet

    const getBalances = async (publicKey) => {
        try {
            const connection = new Connection(
                clusterApiUrl(SOLANA_NETWORK),
                "confirmed"
            );

            const balance = await connection.getBalance(
                new PublicKey(publicKey)
            );

            const balancenew = balance / LAMPORTS_PER_SOL;
            setBalance(balancenew);
        } catch (error) {
            console.error("ERROR GET BALANCE", error);
            toast.error("Something went wrong getting the balance");
        }
    };

    // Desconecta la wallet de nuestro navegador
    const signOut = async () => {
        if(window)
        {
            const {solana} = window; // obtenemos la api de solana 
            window.localStorage.removeItem("publicKey"); // removemos la public key de la wallet
            setPublicKey(null); // establecemos el valor de la public key en nulo
            solana.disconnect(); // desconectamos la wallet de solana
            router.reload(window?.location?.pathname); //recargamos la pagina
            console.log("publicKey", publicKey.toString()); 
        }
    };
    // funcion para conectar una wallet de phantom a la app/web
    const Signin = async () => {
        // phantom no esta instalado

        const provider = window?.phantom?.solana;
        const { solana } = window;
        
        if(!provider?.isPhantom || !solana.isPhantom) {
            toast.error("No se detecto una cartera de phantom wallet");
            setTimeout(() => { window.open("https://phantom.app/","_blank");
            
        }, 2000);
        return;
        }
        // phantom instalado
        let phantom;
        if(provider?.isPhantom) phantom = provider;

        const { publicKey } = await phantom.connect(); // conecta a la cartera de phantom
        console.log("publicKey", publicKey.toString()); 
        setPublicKey(publicKey.toString()); // Guardamos la direccion de la wallet en la public key
        window.localStorage.setItem("publicKey",publicKey.toString());

        getBalances(publicKey);
    };
   return (
    <html>
      {!publicKey ?( 
        <div class="fixed bottom-4 right-4">
                <button type="submit" 
                className="bg-blue-500 text-white w-12 h-12 rounded-full p-2 "
                onClick={() => { 
                    
                    Signin();}}
                >
                    Chat
                </button>
                </div>


      ) : (
<body class="flex flex-col items-center justify-center w-screen min-h-screen bg-gray-100 text-gray-800 p-10">


<button type="submit" 
                className="inline-flex h-8 w-52 border-emerald-50: 5 justify-center bg-emerald-100 font-bold text-emerald-300"
                onClick={() => { 
                    
                    signOut();}}
                >
                    desconectar wallet.
                </button>

<div class="flex flex-col flex-grow w-full max-w-xl bg-white shadow-xl rounded-lg overflow-hidden">
  <div class="flex flex-col flex-grow h-0 p-4 overflow-auto">
    <div class="flex w-full mt-2 space-x-3 max-w-xs">
      <div class="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300"></div>
      <div>
        <div class="bg-gray-300 p-3 rounded-r-lg rounded-bl-lg">
          <p class="text-sm">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
        </div>
        <span class="text-xs text-gray-500 leading-none">2 min ago</span>
      </div>
    </div>
    <div class="flex w-full mt-2 space-x-3 max-w-xs ml-auto justify-end">
      <div>
        <div class="bg-blue-600 text-white p-3 rounded-l-lg rounded-br-lg">
          <p class="text-sm">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod.</p>
        </div>
        <span class="text-xs text-gray-500 leading-none">2 min ago</span>
      </div>
      <div class="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300"></div>
    </div>
    <div class="flex w-full mt-2 space-x-3 max-w-xs ml-auto justify-end">
      <div>
        <div class="bg-blue-600 text-white p-3 rounded-l-lg rounded-br-lg">
          <p class="text-sm">Lorem ipsum dolor sit amet.</p>
        </div>
        <span class="text-xs text-gray-500 leading-none">2 min ago</span>
      </div>
      <div class="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300"></div>
    </div>
    <div class="flex w-full mt-2 space-x-3 max-w-xs">
      <div class="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300"></div>
      <div>
        <div class="bg-gray-300 p-3 rounded-r-lg rounded-bl-lg">
          <p class="text-sm">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. </p>
        </div>
        <span class="text-xs text-gray-500 leading-none">2 min ago</span>
      </div>
    </div>
    <div class="flex w-full mt-2 space-x-3 max-w-xs ml-auto justify-end">
      <div>
        <div class="bg-blue-600 text-white p-3 rounded-l-lg rounded-br-lg">
          <p class="text-sm">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. </p>
        </div>
        <span class="text-xs text-gray-500 leading-none">2 min ago</span>
      </div>
      <div class="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300"></div>
    </div>
    <div class="flex w-full mt-2 space-x-3 max-w-xs ml-auto justify-end">
      <div>
        <div class="bg-blue-600 text-white p-3 rounded-l-lg rounded-br-lg">
          <p class="text-sm">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.</p>
        </div>
        <span class="text-xs text-gray-500 leading-none">2 min ago</span>
      </div>
      <div class="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300"></div>
    </div>
    <div class="flex w-full mt-2 space-x-3 max-w-xs ml-auto justify-end">
      <div>
        <div class="bg-blue-600 text-white p-3 rounded-l-lg rounded-br-lg">
          <p class="text-sm">Lorem ipsum dolor sit amet.</p>
        </div>
        <span class="text-xs text-gray-500 leading-none">2 min ago</span>
      </div>
      <div class="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300"></div>
    </div>
    <div class="flex w-full mt-2 space-x-3 max-w-xs">
      <div class="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300"></div>
      <div>
        <div class="bg-gray-300 p-3 rounded-r-lg rounded-bl-lg">
          <p class="text-sm">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. </p>
        </div>
        <span class="text-xs text-gray-500 leading-none">2 min ago</span>
      </div>
    </div>
    <div class="flex w-full mt-2 space-x-3 max-w-xs ml-auto justify-end">
      <div>
        <div class="bg-blue-600 text-white p-3 rounded-l-lg rounded-br-lg">
          <p class="text-sm">Conecta tu wallet</p>
        </div>
        <button type="submit" class="text-xs text-gray-500 leading-none" onClick={() => { 
                    
                    Signin();}}>conecta tu wallet</button>
      </div>
      <div class="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300"></div>
    </div>
  </div>
  
  <div class="bg-gray-300 p-4">
    <input class="flex items-center h-10 w-full rounded px-3 text-sm" type="text" placeholder="Escribe tu pregunta"/>
  </div>
</div>


</body>

      )}
    </html>

    
  );
};
export default Home;