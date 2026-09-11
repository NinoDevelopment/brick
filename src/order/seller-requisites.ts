import { unquote } from "../common/unquote";

export interface SellerRequisites {
  companyName: string;
  inn: string;
  kpp: string;
  address: string;
  bankName: string;
  bic: string;
  correspondentAccount: string;
  receiverAccount: string;
}

const DEFAULT_SELLER: SellerRequisites = {
  companyName: "ООО «Кирпичный завод Ковернино»",
  inn: "5218001636",
  kpp: "521801001",
  address: "606570, Нижегородская область, р-н Ковернинский, д. Черные",
  bankName: 'ФИЛИАЛ "НИЖЕГОРОДСКИЙ" АО "АЛЬФА-БАНК"',
  bic: "042202824",
  correspondentAccount: "30101810200000000824",
  receiverAccount: "40702810429050009559",
};

export function getSellerRequisites(): SellerRequisites {
  return {
    companyName: unquote(process.env["SELLER_COMPANY_NAME"]) || DEFAULT_SELLER.companyName,
    inn: unquote(process.env["SELLER_INN"]) || DEFAULT_SELLER.inn,
    kpp: unquote(process.env["SELLER_KPP"]) || DEFAULT_SELLER.kpp,
    address: unquote(process.env["SELLER_ADDRESS"]) || DEFAULT_SELLER.address,
    bankName: unquote(process.env["SELLER_BANK_NAME"]) || DEFAULT_SELLER.bankName,
    bic: unquote(process.env["SELLER_BIC"]) || DEFAULT_SELLER.bic,
    correspondentAccount:
      unquote(process.env["SELLER_CORRESPONDENT_ACCOUNT"]) || DEFAULT_SELLER.correspondentAccount,
    receiverAccount:
      unquote(process.env["SELLER_RECEIVER_ACCOUNT"]) || DEFAULT_SELLER.receiverAccount,
  };
}
