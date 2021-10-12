const narationText = (data, owner) => {
    let message = "Nothing Narated"
    if (owner == "RT_wallet_debit" || owner == "RRT_wallet_debit") {
        message = 'Recharge to ' + data.phone + ' (TxnId: ' + data.Transid + ')'
    }
    if (owner == "RT_cashback" || owner == "RRT_cashback") {
        message = 'Recharge Cashback (TxnId: ' + data.Transid + ')'
    }
    if (owner == "RT_failed_wallet_refund") {
        message = 'Refund for mobile number ' + data.phone
    }
    if (owner == "RT_pending_wallet_debit" || owner == "RRT_pending_wallet_debit") {
        message = ""
    }
    if (owner == "RRT_wallet_credit") {
        message = 'Add Money By PG'
    }
    return message
}


module.exports = { narationText }