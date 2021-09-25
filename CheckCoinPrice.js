if ('/exchange/swap' != window.location.pathname) {
    gotoSwapTab()
} else {
    startCheck()
}

async function gotoSwapTab() {
    for (const navi of document.getElementsByClassName('nav-with-bar')) {
        const naviText = navi.textContent.toLowerCase()
        if (naviText.includes('swap') || naviText.includes('스왑')) {
            navi.click()
            break
        }
    }

    while (true) {
        const inputWraps = elmsByCls('md-input-wrap')
        if (2 == inputWraps.length) {
            // console.log('changed')
            break
        }
        // console.log('waiting...')
        await sleep(100)
    }

    startCheck()
}

function startCheck() {
    chrome.storage.sync.get('coinPairs', data => {
        const coinPairs = data.coinPairs

        if ('undefined' == typeof coinPairs) {
            alert('옵션에서 체크할 코인 리스트를 작성해 주세요')
            return
        }
    
        if ('undefined' == typeof coinPairs.list) {
            alert('옵션에서 체크할 코인 리스트를 작성해 주세요')
            return
        }
    
        showCoinPairsPrice(coinPairs.list)
    })
}

function elmsByCls(cls) {
    let doc = this
    if (this == window) {
        doc = document
    }
    return doc.getElementsByClassName(cls)
}

function elmByCls(cls) {
    return elmsByCls.call(this, cls)[0]
}

function elmById(id) {
    return document.getElementById(id)
}

async function showCoinPairsPrice(coinPairs) {
    const r = []

    let lastCoinPair = {from:'', to:''}
    for (const coinPair of coinPairs) {
        const fromToPrices = await getCoinPairPrice(lastCoinPair, coinPair)
        r.push(fromToPrices)
        lastCoinPair = coinPair
    }

    if (0 == r.length) {
        alert('옵션에서 체크할 코인 리스트를 작성해 주세요')
        return
    }

    let msg = '<div>'
    for (const item of r) {
        const from = item.from
        const to = item.to
        const v = item.v

        msg += from + ' to ' + to + '=' + v + '<br/>'
    }

    msg += '</div>'
    msg += '<textarea style="width:100%">'

    for (const item of r) {
        const v = item.v

        msg += v + '&#9;'
    }
    msg += '</textarea>'

    showAlert(msg)
}

async function getCoinPairPrice(lastCoinPair, curCoinPair) {
    const from = curCoinPair.from
    const to = curCoinPair.to

    const inputWraps = elmsByCls('md-input-wrap')
    const fromInput = inputWraps[0].querySelector('input')
    const toInput = inputWraps[1].querySelector('input')

    if (lastCoinPair.from != from) {
        await selectFrom(from)
    }
    
    if (lastCoinPair.to != to) {
        await selectTo(to)
    }
    
    let oldValue = toInput.value
    await setInputValue(fromInput, 100)

    let tryCnt = 0
    let hasSwapRoute = false
    while (true) {
        if (toInput.value != oldValue) {
            hasSwapRoute = true
            break
        }
        await sleep(100)
        ++tryCnt

        if (30 == tryCnt) {
            break
        }
    }

    if (hasSwapRoute) {
        oldValue = toInput.value
        await setInputValue(fromInput, 1)

        tryCnt = 0
        while (true) {
            if (toInput.value != oldValue) {
                break
            }
            await sleep(100)
            ++tryCnt
    
            if (30 == tryCnt) {
                break
            }
        }
    }

    let v = toInput.value

    if (!v) {
        v = '변환 불가'
    }
    
    return {from, to, v}
}

function setInputValue(input, value) {
    input.value = value
    input.dispatchEvent(new Event('input'))
    input.dispatchEvent(new Event('keyup'))
}

async function selectFrom(from) {
    const btnFrom = elmsByCls('ic-token-symbol')[0]
    btnFrom.click()
    await selectCoinInMenu(from)
}

async function selectTo(to) {
    const btnTo = elmsByCls('ic-token-symbol')[1]
    btnTo.click()
    await selectCoinInMenu(to)
}

function sleep(ms) {
    return new Promise((resolve) =>
        setTimeout(resolve, ms)
    );
}

async function selectCoinInMenu(coin) {
    await waitForSelectCoinMenuIsVisible()

    const searchBar = elmByCls('support-token-search').querySelector('input')
    setInputValue(searchBar, coin)
    await sleep(100)
    elmByCls('list-row').click()

    while (true) {
        if (isCoinSelectMenuGone()) {
            break
        }
        await sleep(100)
    }
    //console.log('done')

    async function waitForSelectCoinMenuIsVisible() {
        while (true) {
            if (1 == elmsByCls('gen-modal gen-full-modal select-token-modal').length) {
                break
            }
            await sleep(100)
        }
    }

    function isCoinSelectMenuGone() {
        return 0 == elmsByCls('gen-modal gen-full-modal select-token-modal').length
    }
}

function showAlert(msg) {
    const alert = elmById('gamdoriAlert')
    alert.style.visibility = 'visible'
    
    const elmMsg = alert.querySelector('.alertMsg')
    elmMsg.innerHTML = msg
}