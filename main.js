async function main() {

    let dbSecret = (await resetDatabase()).secret
    let signature = await login('admin', dbSecret)

    // create category model
    let categoryModelId = await query(signature, {
        create: {
            in: {
                tag: "_model"
            },
            value: {
                static: {
                    struct: {
                        name: {
                            string: {}
                        },
                        parents: {
                            list: {
                                ref: "self"
                            }
                        }
                    }
                }
            }
        }
    })

    // tag category model
    await query(signature, {
        create: {
            in: {
                tag: "_tag"
            },
            value: {
                static: {
                    tag: "category",
                    model: categoryModelId
                }
            }
        }
    })

    // create category tree
    let categoryIds = await query(signature, {
        createMultiple: {
            in: {
                tag: "category"
            },
            values: {
                everything: {
                    static: {
                        name: "Everything",
                        parents: [],
                    }
                },
                kids: {
                    static: {
                        name: "Kids",
                        parents: ["everything"],
                    }
                },
                parents: {
                    static: {
                        name: "Parents",
                        parents: ["everything"],
                    }
                },
                singles: {
                    static: {
                        name: "Singles",
                        parents: ["everything"],
                    }
                },
                stressRelief: {
                    static: {
                        name: "Stress Relief",
                        parents: ["parents"],
                    }
                },
                diapers: {
                    static: {
                        name: "Diapers",
                        parents: ["parents", "kids"],
                    }
                },
                games: {
                    static: {
                        name: "Games",
                        parents: ["kids", "singles"],
                    }
                },
                luxury: {
                    static: {
                        name: "Luxury",
                        parents: ["singles"],
                    }
                },
                bongs: {
                    static: {
                        name: "Bongs",
                        parents: ["stressRelief"],
                    }
                },
                jewelry: {
                    static: {
                        name: "Jewelry",
                        parents: ["luxury"],
                    }
                },
            }
        }
    })

    console.log("created category structure")

    // define article source models
    let sourceArticleModels = {
        A: {
            struct: {
                id: {
                    int: {}
                },
                title: {
                    string: {}
                },
                subtitle: {
                    string: {}
                },
                price: {
                    int: {}
                },
                images: {
                    list: {
                        string: {}
                    }
                },
            }
        },
        B: {
            struct: {
                name: {
                    string: {}
                },
                price: {
                    float: {}
                },
                picture: {
                    string: {}
                },
                ean: {
                    string: {}
                },
                currency: {
                    string: {}
                },
            }
        },
        C: {
            struct: {
                title: {
                    string: {}
                },
                description: {
                    string: {}
                },
                cents: {
                    int: {}
                },
                ean: {
                    string: {}
                },
                reference: {
                    int: {}
                },
            }
        }
    }

    // create article source models (and tag them immediately)
    let creationRequests = Object.keys(sourceArticleModels).map(k => {
        let expression = {
            create: {
                in: {
                    tag: "_tag"
                },
                value: {
                    newStruct: {
                        tag: "articleSource" + k,
                        model: {
                            create: {
                                in: {
                                    tag: "_model"
                                },
                                value: {
                                    static: sourceArticleModels[k]
                                }
                            }
                        }
                    }
                }
            }
        }
        return query(signature, expression)
    })

    await Promise.all(creationRequests)

    console.log("created source article models")

    // define source article data
    let sourceArticles = {
        A: {
            id: 123456,
            title: "Farbstiftenset",
            subtitle: "Ein buntes Set Farbstiften zum malen",
            price: 2199,
            images: [
                "https://example.com/pencils-1.jpg",
                "https://example.com/pencils-2.jpg",
                "https://example.com/pencils-3.jpg"
            ]
        },
        B: {
            name: "Spielzeug-Ferrari",
            price: 5.99,
            picture: "https://example.com/toy-car.jpg",
            ean: "9876543210123",
            currency: "CHF"
        },
        C: {
            title: "Ventilador de mesa",
            description: "¡Silencioso pero efectivo!\n\nIdeal para días calurosos en la oficina.",
            cents: 1500,
            ean: "3210123987654",
            reference: 87346
        },
    }

    // create source article data
    creationRequests = Object.keys(sourceArticles).map(k => {
        let expression = {
            create: {
                in: {
                    tag: "articleSource" + k
                },
                value: {
                    static: sourceArticles[k]
                }
            }
        }
        return query(signature, expression)
    })


    await Promise.all(creationRequests)

    console.log("created source article data")

    // create unified article model
    let targetArticleModelId = await query(signature, {
        create: {
            in: {
                tag: "_model"
            },
            value: {
                static: {
                    struct: {
                        title: {
                            string: {}
                        },
                        summary: {
                            optional: {
                                string: {}
                            }
                        },
                        priceInCents: {
                            int: {}
                        },
                        currency: {
                            string: {}
                        },
                        ean: {
                            optional: {
                                string: {}
                            }
                        },
                        images: {
                            list: {
                                string: {}
                            }
                        },
                        language: {
                            string: {}
                        },
                        categories: {
                            list: {
                                ref: categoryModelId
                            }
                        }
                    }
                }
            }
        }
    })

    // tag unified article model (as simply "article")
    await query(signature, {
        create: {
            in: {
                tag: "_tag"
            },
            value: {
                static: {
                    tag: "article",
                    model: targetArticleModelId
                }
            }
        }
    })

    console.log("created consolidated article model")

    // define article migrations
    let articleMigrationExpressions = {
        A: {
            newStruct: {
                title: {
                    field: {
                        name: "title",
                        value: {id:{}}
                    }
                },
                summary: {
                    field: {
                        name: "subtitle",
                        value: {id:{}}
                    }
                },
                priceInCents: {
                    field: {
                        name: "price",
                        value: {id:{}}
                    }
                },
                images: {
                    field: {
                        name: "images",
                        value: {id:{}}
                    }
                },
                currency: "CHF",
                language: "DE",
                categories: {
                    newList: [
                        {
                            newRef: {
                                model: {tag: "category"},
                                id: categoryIds.kids,
                            }
                        }
                    ]
                }
            }
        },
        B: {
            newStruct: {
                title: {
                    field: {
                        name: "name",
                        value: {id:{}}
                    }
                },
                priceInCents: {
                    floatToInt: {
                        multiply: [ {newFloat: 100}, {
                            field: {
                                name: "price",
                                value: {id:{}}
                            }
                        } ]
                    }
                },
                images: {
                    newList: [
                        {
                            field: {
                                name: "picture",
                                value: {id:{}}
                            }
                        }
                    ]
                },
                currency: {
                    field: {
                        name: "currency",
                        value: {id:{}}
                    }
                },
                ean: {
                    field: {
                        name: "ean",
                        value: {id:{}}
                    }
                },
                language: "DE",
                categories: {
                    newList: [
                        {
                            newRef: {
                                model: {tag: "category"},
                                id: categoryIds.singles,
                            }
                        }
                    ]
                }
            }
        },
        C: {
            newStruct: {
                title: {
                    field: {
                        name: "title",
                        value: {id:{}}
                    }
                },
                summary: {
                    field: {
                        name: "description",
                        value: {id:{}}
                    }
                },
                priceInCents: {
                    field: {
                        name: "cents",
                        value: {id:{}}
                    }
                },
                images: {
                    zero: {}
                },
                ean: {
                    field: {
                        name: "ean",
                        value: {id:{}}
                    }
                },
                language: "ES",
                currency: "EUR",
                categories: {
                    newList: [
                        {
                            newRef: {
                                model: {tag: "category"},
                                id: categoryIds.luxury,
                            }
                        }
                    ]
                }
            }
        }
    }

    // create migration expressions and migrations (at once)
    let migrationExpressionCreationRequests = Object.keys(articleMigrationExpressions).map(k => {
        let expression = {
            create: {
                in: {
                    tag: "_migration"
                },
                value: {
                    newStruct: {
                        from: {
                            tag: "articleSource" + k
                        },
                        to: {
                            tag: "article"
                        },
                        expression: {
                            create: {
                                in: {
                                    tag: "_expression"
                                },
                                value: {
                                    static: articleMigrationExpressions[k]
                                }
                            }
                        }
                    }
                }
            }
        }
        return query(signature, expression)
    })

    await Promise.all(migrationExpressionCreationRequests)

    console.log("created migrations, sleeping for 10 seconds")

    await sleep(10 * 1000)

    // get all articles and print them out
    result = await query(signature, {all:{tag: "article"}})
    result.forEach(a => {
        console.log( JSON.stringify(a, null, 4) )
    })

    // perform graph query and print result out
    result = await query(signature, {
        graphFlow: {
            start: {
                newRef: {
                    model: {
                        tag: "category"
                    },
                    id: categoryIds.singles
                }
            },
            flow: [
                {
                    from: {
                        tag: "category"
                    },
                    backward: [
                        {tag: "category"},
                        {tag: "article"}
                    ]
                }
            ]
        }
    })

    console.log("graph query result")
    console.log( JSON.stringify(result, null, 4) )

}


// STUFF BEYOND THIS POINT IS IRRELEVANT TO THE PRESENTATION


const fetch = require('node-fetch')

const baseUrl  = 'http://localhost:3050'
const database = 'demo'
const codec    = 'json'

const instanceSecret = '6g+ttKGHDryoed4GVAYnw5nMsupfVc+o4KaRDL+zNgIJ76BV8sMVZWa6VqeYreVCcDbfzl1wgarfz9NgCbBTBj/OfsuiGw+5eE9YUC6UO7pANjYPovbzz3ix79QsdcARPA+C2pGa/aCbubFPwkO6w4+LrczlC0U67owXI4eDzpGCWxV1Y69VJs7gg5sNxa0mqNMuJiVhoPdt3DqcqIW8sHU0trq9T7Eiv6WkTkmqH76eNh/J9ienUGe+NzsEHzYRUReUBwsji8HE4NW/uneC4bLAlbagf74PONKilM+n+6p6Rcxy23k8oqSYW5pjngDx7DS3lT1XlARtFIO3HqtibilUKCngELpGaAzaaYwO42vrhaeDFj4Kequbb4Z2RbwBh8qgUkhuS8sZoryTGLUpXlBQS78tEoeYmjWef9eGlVmHn7YGlj0dA7TAvbfn+MwMJ8JKmX2ChlnAOWGdNW8xP9RDpeLdRKzCqxXu0E139qhrQHEpim5Dw/kP5eNnfk610R58dzG+CtLlBJpO31SbIyVqsIU6t47HN5jUkX2GXksn/Kn+op1K4ZZRhhsTGRMJT3/WVGtXc16ErihPkPzpk+LxFCAW9fhG/elpoEohdB3W7xcb78AbEV0eEcfOPnu6MA40qJh6HtxXvaw62a0/+nwpsAFR03+UUjDcOCYZquM='

function fetchJson(/* variadic */) {
    return fetch.apply(null, arguments).then(r => r.json())
}

async function deleteDatabase() {
    return await fetchJson(baseUrl + '/root/delete_db', {
        method: 'post',
        headers: {
            'X-Karma-Secret': instanceSecret,
            'X-Karma-Codec': codec,
        },
        body: JSON.stringify(database),
    })
}

async function createDatabase() {
    return await fetchJson(baseUrl + '/root/create_db', {
        method: 'post',
        headers: {
            'X-Karma-Secret': instanceSecret,
            'X-Karma-Codec': codec,
        },
        body: JSON.stringify(database),
    })
}

async function resetDatabase() {
    await deleteDatabase()
    return await createDatabase()
}

async function login(username, password) {
    return await fetchJson(baseUrl + '/auth', {
        method: 'post',
        headers: {
            'X-Karma-Database': database,
            'X-Karma-Codec': codec,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: username,
            password: password,
        }),
    })
}

async function query(signature, query) {
    return await fetchJson(baseUrl + '/', {
        method: 'post',
        headers: {
            'X-Karma-Database': database,
            'X-Karma-Codec': codec,
            'X-Karma-Signature': signature,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(query),
    })
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


main()