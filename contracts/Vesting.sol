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
    CountersUpgradeable.Counter private _schemeDetailIds;

    struct VestingInformation {
        uint256 maxSupplyClaim;
        uint256 lastClaimId;
        uint256 schemeId;
        uint256 startTime;
        address wallet;
    }
    
    struct SchemeInformation {
        uint256 timeClaim;
        uint256 durationTime;
        address tokenAddress;
    }

    struct SchemeDetail {
        uint numerator;
        uint denominator;
        uint timeWithDraw;
    }

    mapping(uint256 => VestingInformation) vestingInfors;
    mapping(uint256 => SchemeInformation) schemeInfos;
    mapping(uint256 => mapping(uint256 => SchemeDetail)) schemeDetails;


    uint256[] ids;

    address public preventiveWallet;
    mapping(address => bool) private _operators;
    address[] public listOperators;

    event NewVestingInformation(
        uint256 schemeId,
        uint256 amountDeposit,
        address wallet,
        uint256 maxSupplyClaim,
        bool status,
        uint256 lastClaimId,
        uint256 vestingId
    );
    
    event NewSchemeInformation(
        uint256 schemeId,
        address tokenAddress,
        uint256 durationTime,
        uint256 timeClaim
    );

    event AddToken(
        uint256 amount,
        uint256 startTime
    );
    event Claim(address wallet, uint256 amount, uint256 blockTime);
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

    function addToken(
        uint256 _amount, 
        uint256 _vestingId, 
        address _walletAddress, 
        address _tokenAddress,
        uint[] memory _numerators,
        uint[] memory _denominators,
        uint[] memory _timeWithDraws
        ) public onlyOperator {
        VestingInformation storage vest = vestingInfors[_vestingId];
        SchemeInformation memory scheme = schemeInfos[vest.schemeId];
        require(vest.maxSupplyClaim != uint256(0), "vesting information not found!");
        require(
            _amount == vest.maxSupplyClaim,
            "amount-deposit-must-equal-max-supply-claim"
        );
        vest.startTime = block.timestamp;
        
        addMutilRound(_vestingId, scheme.timeClaim, _numerators, _denominators, _timeWithDraws);
        IERC20Upgradeable(_tokenAddress).safeTransferFrom(
            _walletAddress,
            address(this),
            _amount
        );
    }

    function newSchemeInformation(
        uint256 durationTime,
        uint32 timeClaim,
        address tokenAddress
    ) public onlyOperator {
        require(_validate(0, 1));
        _schemeIds.increment();
        uint256 id = _schemeIds.current();
        SchemeInformation storage schemeInfo = schemeInfos[id];
        schemeInfo.durationTime = durationTime;
        schemeInfo.tokenAddress = tokenAddress;
        schemeInfo.timeClaim = timeClaim;
        emit NewSchemeInformation(
            id,
            schemeInfo.tokenAddress, 
            schemeInfo.durationTime,
            schemeInfo.timeClaim
        );
    }

    function addMutilRound(
        uint256 _vestingId,
        uint256 _count,
        uint[] memory _numerators,
        uint[] memory _denominators,
        uint[] memory _timeWithDraws
    ) public onlyOperator{
        for(uint256 i = 0; i < _count; i ++) {
            _addRound(_vestingId ,_numerators[i], _denominators[i], _timeWithDraws[i]);
        }
    }

    function _addRound(uint256 _vestingId ,uint _numerator, uint _denominator, uint _timeWithDraw) internal{
        require(_validate(_vestingId, 0), "vesting not found");
        _schemeDetailIds.increment();
        SchemeDetail storage schemeDetail = schemeDetails[_vestingId][_schemeDetailIds.current()];
        schemeDetail.numerator = _numerator;
        schemeDetail.denominator = _denominator;
        schemeDetail.timeWithDraw = _timeWithDraw;
    }

    function _validate(uint256 _vestingId, uint8 _type) internal view returns(bool) {
        if(_type == 0) {
            if(vestingInfors[_vestingId].maxSupplyClaim <= 0 ) {
                return false;
            }
        } else if (_type == 1) {

        } else {

        }
        return true;
    }

    function newVestingInformation(
        address wallet,
        uint256 maxSupplyClaim,
        uint256 amountDeposit,
        uint256 schemeId,
        uint256 lastClaimId,
        uint[] memory _numerators,
        uint[] memory _denominators,
        uint[] memory _timeWithDraws
    ) public onlyOperator {
        SchemeInformation storage schemeInfo = schemeInfos[schemeId];
        require(wallet != address(0), "wallet not found");
        require(maxSupplyClaim > 0, "maxSupplyClaim must be greater than 0");
        require(schemeId > 0, "schemeId invalid");
        require(schemeInfo.durationTime > 0, "scheme not found");

        _vestingIds.increment();
        VestingInformation storage vestingInfo = vestingInfors[_vestingIds.current()];
        vestingInfo.maxSupplyClaim = maxSupplyClaim;
        vestingInfo.wallet = wallet;
        vestingInfo.schemeId = schemeId;
        vestingInfo.lastClaimId = lastClaimId;
        if(amountDeposit > 0) {
            addToken(amountDeposit, _vestingIds.current(), wallet, schemeInfo.tokenAddress, _numerators, _denominators, _timeWithDraws);
        }
        bool status = false;
        if(vestingInfo.startTime > 0) {
            status = true;
        }
        emit NewVestingInformation(schemeId, amountDeposit, wallet, maxSupplyClaim, status, lastClaimId, _vestingIds.current());
    }

    function claim(address _wallet, uint256 _vestingId, uint256 _schemeDetailId, uint256 _schemeId, bool isClaimAll) public nonReentrant whenNotPaused {
        require(!msg.sender.isContract(), "caller-invalid");
        
        VestingInformation storage vestingInfo = vestingInfors[_vestingId];
        SchemeInformation storage schemeInfo = schemeInfos[_schemeId];
        require(vestingInfo.schemeId > 0, "vesting info not found");
        uint256 withdrawable = 0;
        if(!isClaimAll) {
            SchemeDetail storage schemeDetail = schemeDetails[_schemeId][_schemeDetailId]; 
            if(block.timestamp > schemeDetail.timeWithDraw) {
                withdrawable = vestingInfo.maxSupplyClaim
                                    .mul(schemeDetail.numerator)
                                    .div(schemeDetail.denominator);
                require(IERC20Upgradeable(schemeInfo.tokenAddress).balanceOf(address(this)) > withdrawable, "contract dont have enough token to transfer");
                IERC20Upgradeable(schemeInfo.tokenAddress).transfer(_wallet, withdrawable);
                vestingInfo.lastClaimId = _schemeDetailId;
            }
        } else {
            for(uint i = vestingInfo.lastClaimId;i < schemeInfo.timeClaim ; i++) {
                SchemeDetail storage schemeDetail = schemeDetails[_schemeId][i.add(1)]; 
                if(schemeDetail.timeWithDraw > block.timestamp) {
                    vestingInfo.lastClaimId = i;
                    break;
                }
                withdrawable = withdrawable.add(vestingInfo.maxSupplyClaim
                                    .mul(schemeDetail.numerator)
                                    .div(schemeDetail.denominator));
            }
            require(IERC20Upgradeable(schemeInfo.tokenAddress).balanceOf(address(this)) > withdrawable, "contract dont have enough token to transfer");
            IERC20Upgradeable(schemeInfo.tokenAddress).transfer(_wallet, withdrawable);
        }
        emit Claim(_wallet, withdrawable, block.timestamp);
    }

    function getListOperators() public view returns (address[] memory) {
        return listOperators;
    }

}
