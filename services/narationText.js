const narationText = (data, owner) => {
    let message = "Nothing Narated"
    if (owner == "RT_wallet_debit" || owner == "RRT_wallet_debit") {
        message = 'Recharge to ' + data.phone + ' (TxnId: <txn_id>)'
    }
    if (owner == "RT_cashback" || owner == "RRT_cashback") {
        message = 'Recharge Cashback (TxnId: <txn_id>)'
    }
    if (owner == "RT_failed_wallet_refund") {
        message = 'Refund for mobile number ' + data.phone + '(TxnId: <txn_id>)'
    }
    if (owner == "RT_pending_wallet_debit" || owner == "RRT_pending_wallet_debit") {
        message = ""
    }
    if (owner == "RRT_wallet_credit") {
        message = 'Add Money By PG (TxnId: <txn_id>)'
    }
    if (owner == 'admin_wallet') {
        message = "Wallet balance creditde/debited by admin (TxnId: <txn_id>)"
    }
    if (owner == 'admin_wallet_credit') {
        message = "Wallet balance credited by admin (TxnId: <txn_id>)"
    }
    if (owner == 'admin_wallet_debit') {
        message = "Wallet balance debited by admin (TxnId: <txn_id>)"
    }
    return message
}

const getNaration = (id, narateText) => {
    let text = narateText.replace('<txn_id>', id)
    return text
}

module.exports = { narationText, getNaration }