import {ethers} from 'ethers'

const SIGNING_DOMAIN_NAME = "SetTest"
const SIGNING_DOMAIN_VERSION = "1"

/**
 * JSDoc typedefs.
 * 
 * @typedef {object} Content
 * @property {string} name 
 * @property {string} description 
 */

class MessageContent {
/**
   * Create a new LazyMinter targeting a deployed instance of the LazyNFT contract.
   * 
   * @param {Object} options
   */
    constructor() {}

    /**
   * Creates a new Content object
   * 
   * @param {string} name 
   * @param {string} description
   * 
   * @returns {Content}
   */
    async createContent(name, description) {
        const content = {name, description}
        return {
            ...content,
        }
    }
}

module.exports = {
    MessageContent
}
