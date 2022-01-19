//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "./ArrayLib.sol";

contract Vesting is 
    UUPSUpgradeable,
    OwnableUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable
{
    using AddressUpgradeable for address;
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using SafeMathUpgradeable for uint256;
    using CountersUpgradeable for CountersUpgradeable.Counter;
    CountersUpgradeable.Counter private _vestingIds;
    CountersUpgradeable.Counter private _schemeIds;

    struct VestingInformation {
        string name;
        address wallet;
        uint256 schemeId;
        uint256 startTime;
        uint256 totalAmount;
        uint256 vestedAmount;
        uint256 totalClaimed;
        uint256 periodAmount;
        // 0: inactive, 1: active, 2: completed
        uint8 status;
    }
    
    struct SchemeInformation {
        string name;
        uint256 vestTime;
        uint256 cliffTime;
        uint256 durationTime;
        uint256 periodTime;
        address tokenAddress;
    }

    // @dev get vestingInformation by index
    mapping(uint256 => VestingInformation) vestingInfors;
    // @dev get vestingInformations list by wallet
    mapping(address => uint256[]) walletToVestingInfor;
    // @dev get schemeInfo by index
    mapping(uint256 => SchemeInformation) schemeInfos;

    // @dev declare variables for role
    address public preventiveWallet;
    mapping(address => bool) private _operators;
    address[] public listOperators;

    // @dev create vesting event
    event NewVestingInformation(
        string name,
        address wallet,
        uint256 vestingId,
        uint256 schemeId,
        uint256 amountDeposit,
        uint256 totalSupply,
        uint256 vestedAmount,
        uint256 startTime,
        uint256 periodAmount,
        uint8 status
    );
    
    // @dev create scheme event
    event NewSchemeInformation(
        string name,
        address tokenAddress,
        uint256 vestingId,
        uint256 cliffTime,
        uint256 vestTime,
        uint256 durationTime,
        uint256 periodTime
    );

    event AddToken(uint256 amount);
    event Claim(address wallet, uint256 amount);
    event EmergencyWithdraw(address preventiveWallet, uint256 amount);
    event PreventiveWallet(address preventiveWallet);
    event Operator(address operator, bool isOperator);

    modifier onlyOperator() {
        require(_operators[_msgSender()]);
        _;
    }

    function initialize(address _preventiveWallet)
        public
        initializer
    {
        __Pausable_init();
        __UUPSUpgradeable_init();
        __Ownable_init();
        __ReentrancyGuard_init();
        preventiveWallet = _preventiveWallet;
        _operators[msg.sender] = true;
        listOperators.push(msg.sender);
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function emergencyWithdraw(address _erc20Token) public whenPaused onlyOwner {
        uint256 balanceOfThis = IERC20Upgradeable(_erc20Token).balanceOf(address(this));
        IERC20Upgradeable(_erc20Token).transfer(preventiveWallet, balanceOfThis);
        emit EmergencyWithdraw(preventiveWallet, balanceOfThis);
    }

    function setPreventiveWallet(address preventiveAddress) public onlyOwner {
        preventiveWallet = preventiveAddress;
        emit PreventiveWallet(preventiveWallet);
    }

    function setOperator(address operator, bool isOperator) public onlyOwner {
        _operators[operator] = isOperator;

        (bool isOperatorBefore, uint256 indexInArr) = ArrayLib
            .checkExistsInArray(listOperators, operator);

        if (isOperator && !isOperatorBefore) {
            listOperators.push(operator);
        }
        if (!isOperator && isOperatorBefore) {
            listOperators = ArrayLib.removeOutOfArray(
                listOperators,
                indexInArr
            );
        }
        emit Operator(operator, isOperator);
    }

    //@dev add token from admin to contract
    function addToken(uint256 _amount, address _wallet, address _tokenAddress) public onlyOperator {
        IERC20Upgradeable(_tokenAddress).safeTransferFrom(
            _wallet,
            address(this),
            _amount
        );
        emit AddToken(_amount);
    }

    function newSchemeInformation(
        string memory name,
        uint256 vestTime,
        uint256 cliffTime,
        uint256 durationTime,
        address tokenAddress
    ) public onlyOperator {
        require(vestTime > 0, "time claim must be greater than 0");
        require(cliffTime > 0, "time claim must be greater than 0");
        require(durationTime > 0, "time claim invalid");
        require(tokenAddress != address(0), "tokenAddress invalid");
        require(bytes(name).length > 0, "scheme name is required");
        _schemeIds.increment();
        uint256 id = _schemeIds.current();
        SchemeInformation storage schemeInfo = schemeInfos[id];
        schemeInfo.tokenAddress = tokenAddress;
        schemeInfo.name = name;
        schemeInfo.vestTime = vestTime;
        schemeInfo.cliffTime = cliffTime;
        schemeInfo.durationTime = durationTime;
        schemeInfo.periodTime = durationTime.div((cliffTime.add(vestTime)));
        emit NewSchemeInformation(
            name,
            schemeInfo.tokenAddress, 
            id,
            schemeInfo.cliffTime,
            schemeInfo.vestTime,
            schemeInfo.durationTime,
            schemeInfo.periodTime
        );
    }

    function newVestingInformation(
        address wallet,
        string memory name,
        uint256 totalAmount,
        uint256 amountDeposit,
        uint256 totalClaimed,
        uint256 schemeId,
        uint256 startTime,
        uint256 vestedAmount,
        uint256 periodAmount
    ) public onlyOperator {
        SchemeInformation storage schemeInfo = schemeInfos[schemeId];
        require(wallet != address(0), "wallet is required");
        require(totalClaimed > 0, "maxSupplyClaim must be greater than 0");
        require(schemeId > 0, "schemeId invalid");
        require(schemeInfo.durationTime > 0, "scheme not found");
        require(bytes(name).length > 0, "vesting name is required");
        require(startTime > 0, "startTime is required");
        require(vestedAmount > 0, "vestedAmount must be greater than 0");
        require(periodAmount > 0, "vestedAmount must be greater than 0");
        require(totalAmount > 0, "vestedAmount must be greater than 0");

        _vestingIds.increment();
        VestingInformation storage vestingInfo = vestingInfors[_vestingIds.current()];
        walletToVestingInfor[msg.sender].push(_vestingIds.current());
        vestingInfo.totalAmount = totalAmount;
        vestingInfo.name = name;
        vestingInfo.wallet = wallet;
        vestingInfo.schemeId = schemeId;
        vestingInfo.startTime = startTime;
        vestingInfo.vestedAmount = vestedAmount;
        vestingInfo.periodAmount = periodAmount;
        vestingInfo.totalClaimed = totalClaimed;
        vestingInfo.periodAmount = periodAmount;
        if(amountDeposit > 0) {
            addToken(amountDeposit, msg.sender, schemeInfo.tokenAddress);
        }
        vestingInfo.status = 0;
        if(vestingInfo.startTime > 0) {
            vestingInfo.status = 1;
        }
        emit NewVestingInformation(
            name, 
            wallet, 
            _vestingIds.current(), 
            schemeId, 
            amountDeposit, 
            totalAmount,
            vestedAmount,
            startTime,
            periodAmount,
            vestingInfo.status
        );
    }

    function claim(address _wallet, bool _isClaimAll, uint256 _vestingId) public nonReentrant whenNotPaused {
        require(!msg.sender.isContract(), "caller-invalid");
        
        uint256 withdrawable = 0;
        
        if(_isClaimAll) {
            
        } else {
            VestingInformation storage vestingInfo = vestingInfors[_vestingId];
            SchemeInformation memory schemeInfo = schemeInfos[vestingInfo.schemeId];
            uint256 totalTime = schemeInfo.cliffTime.add(schemeInfo.vestTime);
            
            for(uint i = 0; i < totalTime; i++) {
                
                require(vestingInfo.startTime.add(schemeInfo.periodTime) > block.timestamp, "not in time");
            }

        }

        // require(IERC20Upgradeable(schemeInfo.tokenAddress).balanceOf(address(this)) > withdrawable, "contract dont have enough token to transfer");
        // IERC20Upgradeable(schemeInfo.tokenAddress).transfer(_wallet, withdrawable);
        // emit Claim(_wallet, withdrawable);
    }

    function _getAmountCanClaim() internal returns(uint256) {
        
    }

    function getListOperators() public view returns (address[] memory) {
        return listOperators;
    }

}
